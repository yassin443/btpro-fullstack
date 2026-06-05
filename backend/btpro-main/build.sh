#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py shell -c "
from users.models import User
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(email='$SUPERUSER_EMAIL', password='$SUPERUSER_PASSWORD')
    print('Superuser created')
else:
    print('Superuser already exists')
"
