from google.appengine.ext import db

class Account(db.Model):
    user = db.UserProperty(required=True)
    keys = db.StringListProperty()

