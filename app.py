"""One Bothost process: HTTP pages/API, Bot API polling and public-market collector."""
import atexit
import functools
import logging
import re
import time
from pathlib import Path
from urllib.parse import urlsplit
from flask import Flask, jsonify, request, send_from_directory
from settings import ROOT, Settings
from storage import Store
from collector import Collector
from bot_service import TelegramBot
from telegram_auth import verify_init_data, AuthError
from prepare_site import ensure_site
from payments import register_payments
from gift_catalog import register_catalog

def create_app(settings=None, *, store=None, collector=None, bot=None):
    settings=settings or Settings.from_env()
    settings.data_dir.mkdir(parents=True,exist_ok=True)
    store=store or Store(settings.data_dir/'market.sqlite3')
    collector=collector or Collector(settings,store)
    bot=bot or TelegramBot(settings,store,collector)
    app=Flask(__name__,static_folder=None)
    app.config.update(MAX_CONTENT_LENGTH=32768,JSON_SORT_KEYS=False)
    app.extensions.update(settings=settings,store=store,collector=collector,bot=bot)
    public=ROOT/'public'
    register_payments(app,settings,store)
    register_catalog(app,settings,store,public)

    def admin(handler):
        @functools.wraps(handler)
        def wrapped(*args,**kwargs):
            body=request.get_json(silent=True) or {}
            if not isinstance(body,dict):
                return jsonify(error='invalid_request'),400
            try:
                user=verify_init_data(body.get('initData',''),settings.bot_token)
                if not settings.admin_id or user['id']!=settings.admin_id:
                    raise AuthError('Owner access required')
            except (AuthError,ValueError,TypeError):
                return jsonify(error='owner_authorization_required',message='Откройте панель из своего бота. Владелец задаётся в ADMIN_TELEGRAM_ID.'),403
            return handler(body,*args,**kwargs)
        return wrapped

    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
        if request.path.startswith('/api/') or request.path in ('/','/admin','/catalog','/health'):
            response.headers['Cache-Control']='no-store'
        return response

    @app.get('/health')
    def health():
        return jsonify(ok=True,service='gift-catalog',bot_configured=bool(settings.bot_token),source_configured=bool(settings.api_key))

    @app.get('/api/status')
    def status():
        return jsonify({**collector.status(),'server_time':time.time(),'independent_app':True,'read_only':True})

    @app.post('/api/telegram/me')
    def telegram_profile():
        body=request.get_json(silent=True)
        if not isinstance(body,dict):
            return jsonify(error='invalid_request'),400
        try:
            user=verify_init_data(body.get('initData',''),settings.bot_token)
        except (AuthError,ValueError,TypeError):
            return jsonify(error='telegram_authorization_required',message='Откройте миниапп заново из кнопки вашего бота.'),403
        profile={'id':user['id']}
        for field in ('first_name','last_name','username'):
            value=user.get(field)
            if isinstance(value,str):profile[field]=value[:128]
        photo=user.get('photo_url')
        if isinstance(photo,str) and len(photo)<=4096:
            try:
                parsed=urlsplit(photo)
                if parsed.scheme=='https' and parsed.hostname and not parsed.username and not parsed.password:
                    profile['photo_url']=photo
            except ValueError:pass
        return jsonify(user=profile,verified=True,read_only=True)

    @app.post('/api/reports')
    def report():
        body=request.get_json(silent=True)
        if not isinstance(body,dict):return jsonify(error='invalid_request'),400
        try:user=verify_init_data(body.get('initData',''),settings.bot_token)
        except (AuthError,ValueError,TypeError):return jsonify(error='telegram_authorization_required'),403
        item=body.get('item','')
        if not isinstance(item,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',item):
            return jsonify(error='invalid_item'),400
        # A report belongs to this independent application, never to Telegram/MRKT.
        created=store.report(user['id'],item)
        return jsonify(ok=created,duplicate=not created,destination='application_moderation'),201 if created else 409

    @app.get('/api/admin/reports')
    def reports_require_post():
        return jsonify(error='owner_authorization_required'),403

    @app.post('/api/admin/reports')
    @admin
    def report_list(body):
        return jsonify(reports=store.reports())

    @app.get('/api/catalog')
    def catalog():
        try:
            limit=max(1,min(200,int(request.args.get('limit','100'))))
            offset=min(2**63-1,max(0,int(request.args.get('offset','0'))))
        except ValueError:
            return jsonify(error='invalid_pagination'),400
        return jsonify({**store.catalog(limit,offset),'currency':'TON','source':'mrkt','read_only':True})

    @app.get('/api/events')
    def events():
        try:
            after=min(2**63-1,max(0,int(request.args.get('after','0'))))
        except ValueError:
            return jsonify(error='invalid_cursor'),400
        rows=store.history(after,100)
        return jsonify(events=rows,next_after=rows[-1]['sequence'] if rows else after)

    @app.post('/api/admin/status')
    @admin
    def admin_status(body):
        return jsonify({**collector.status(),'admin_configured':True})

    @app.post('/api/admin/control')
    @admin
    def control(body):
        action=body.get('action')
        if action not in ('start','stop','refresh'):
            return jsonify(error='unknown_action'),400
        try:
            collector.set_enabled(action!='stop')
        except ValueError as exc:
            return jsonify(error='source_not_configured',message=str(exc)),409
        return jsonify(ok=True,status=collector.status())

    @app.post('/api/admin/events')
    @admin
    def export(body):
        try:
            after=min(2**63-1,max(0,int(body.get('after',0))))
        except (TypeError,ValueError):
            return jsonify(error='invalid_cursor'),400
        rows=store.history(after,1000)
        return jsonify(events=rows,next_after=rows[-1]['sequence'] if rows else after)

    @app.get('/')
    def index():
        return send_from_directory(public,'index.html')

    @app.get('/catalog')
    def live_catalog():
        return send_from_directory(public,'catalog-live.html')

    @app.get('/admin')
    def admin_page():
        return send_from_directory(public,'admin.html')

    @app.get('/<path:filename>')
    def static_file(filename):
        if filename.startswith('api/') or any(part.startswith('.') for part in Path(filename).parts):
            return jsonify(error='not_found'),404
        return send_from_directory(public,filename,max_age=3600)

    @app.errorhandler(413)
    def too_large(error):
        return jsonify(error='request_too_large'),413

    @app.errorhandler(404)
    def not_found(error):
        return jsonify(error='not_found'),404
    return app

def main():
    logging.basicConfig(level=logging.INFO,format='%(levelname)s %(name)s: %(message)s')
    settings=Settings.from_env()
    if not 1<=settings.port<=65535:
        raise ValueError('PORT must be between 1 and 65535')
    ensure_site(ROOT)
    app=create_app(settings)
    bot=app.extensions['bot'];collector=app.extensions['collector']
    atexit.register(bot.close);atexit.register(collector.close)
    collector.start();bot.start()
    logging.info('Listening on 0.0.0.0:%s; bot=%s; market API=%s',settings.port,bool(settings.bot_token),bool(settings.api_key))
    from waitress import serve
    serve(app,host='0.0.0.0',port=settings.port,threads=8)

if __name__=='__main__':
    main()
