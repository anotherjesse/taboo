from google.appengine.ext import db

class Account(db.Model):
    user = db.UserProperty(required=True)
    keys = db.StringListProperty()


class Person(db.Model):
    name = db.StringProperty()
    ssn = db.StringProperty()
    created = db.DateTimeProperty(auto_now_add=True)
