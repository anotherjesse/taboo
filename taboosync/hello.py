from google.appengine.ext import db
from google.appengine.api import users
from vendor import web
from models import *

urls = (
  '/', 'index',
  '/list', 'list'
)

render = web.template.render('templates', base='base')

def get_acct():
    user = users.get_current_user()
    if user:
        acct_list = Account.gql("WHERE user = :1", user).fetch(1)
        if acct_list:
            return acct_list[0]
        acct = Account(user=user)
        acct.put
        return acct
    return False

class index:
    def GET(self):
        acct = get_acct()
        if acct:
            return render.index(acct)
        return web.found(users.create_login_url(web.webapi.ctx.path))
    def POST(self):
        acct = get_acct()
        if acct:
            i = web.input()
            acct.keys = i.data
            acct.put()
            return web.seeother('/list')
        return web.found(users.create_login_url(web.webapi.ctx.path))

class list:
    def GET(self):
        acct = get_acct()
        return render.list(acct.keys)

app = web.application(urls, globals())
main = app.cgirun()
