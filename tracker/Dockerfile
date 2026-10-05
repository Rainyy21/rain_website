FROM python:3.12-slim
WORKDIR /app
COPY tracker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY tracker/app.py tracker/check_links.py ./
COPY links.json ./links.json
RUN useradd -r app && chown -R app /app
USER app
EXPOSE 8000
# One worker so the in-memory rate limiter sees every request; threads handle concurrency.
CMD ["gunicorn", "-b", "0.0.0.0:8000", "--workers", "1", "--threads", "8", "app:app"]
