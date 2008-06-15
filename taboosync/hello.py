from google.appengine.ext import db
from google.appengine.api import users
from vendor import web
from models import *

urls = (
  '/', 'index',
  '/list', 'list',
  '/logout', 'logout'
)

render = web.template.render('templates', base='base')

class index:
    def GET(self):
        user = users.get_current_user()
        if user:
            acct_list = Account.gql("WHERE user = :1", user).fetch(1)
            if acct_list:
                return render.index(acct_list[0], users.create_logout_url('/'))
            acct = Account(user=user)
            acct.put()
            return render.index(acct, users.create_logout_url('/'))
        else:
            return web.found(users.create_login_url(web.webapi.ctx.path))
    def POST(self):
        i = web.input()
        person = Person()
        person.name = i.name
        person.put()
        return web.seeother('/list')

class list:
    def GET(self):
        people = db.GqlQuery("SELECT * FROM Person ORDER BY created DESC LIMIT 10")
        return render.list(people)

app = web.application(urls, globals())
main = app.cgirun()
