from google.appengine.ext import db

class Account(db.Model):
    user = db.UserProperty(required=True)
    data = db.StringProperty()

