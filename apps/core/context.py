from threading import local

_thread_locals = local()

def get_current_user():
    return getattr(_thread_locals, 'user', None)

def get_current_school():
    return getattr(_thread_locals, 'school', None)

def set_current_context(user=None, school=None):
    _thread_locals.user = user
    _thread_locals.school = school

def clear_context():
    _thread_locals.user = None
    _thread_locals.school = None
