from flask import Blueprint, request, redirect, send_from_directory
import os

routes = Blueprint('routes', __name__)

@routes.route('/')
def index():
    return redirect('templates/index.html')

@routes.route('/templates/<path:filename>')
def serve_static(filename):
    return send_from_directory('templates', filename)

