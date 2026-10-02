"""Exercise password recovery pages against a local frontend using mocked API responses.

Run: python frontend/tests/password-recovery-ui.py http://localhost:3111
"""
import sys
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3111'
artifacts = Path(tempfile.mkdtemp(prefix='badminton-recovery-'))
token = 'a' * 64

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    for theme in ('light', 'dark'):
        context = browser.new_context(viewport={'width': 390 if theme == 'light' else 1200, 'height': 800})
        context.add_init_script(f"localStorage.setItem('theme', '{theme}');")
        page = context.new_page()
        errors = []
        requests = []
        page.on('pageerror', lambda error: errors.append(str(error)))

        def respond(route):
            data = route.request.post_data_json
            requests.append((route.request.url, data))
            if route.request.url.endswith('/auth/reset-password') and data['password'] == 'expired-password':
                route.fulfill(status=400, json={'message': 'Invalid or expired reset link'})
            else:
                route.fulfill(status=202 if route.request.url.endswith('/auth/forgot-password') else 200, json={'message': 'ok'})

        page.route('**/api/auth/forgot-password', respond)
        page.route('**/api/auth/reset-password', respond)
        page.goto(base + '/login', wait_until='domcontentloaded')
        page.get_by_role('link', name='Forgot Password?').click()
        page.wait_for_url('**/forgot-password')
        expect(page.get_by_role('heading', name='Forgot password?')).to_be_visible()
        page.locator('#recovery-email').fill('student@kmitl.ac.th')
        page.get_by_role('button', name='Send reset link').click()
        expect(page.get_by_role('status')).to_contain_text('If this email belongs to an account')
        assert len(requests) == 1 and requests[0][1] == {'email': 'student@kmitl.ac.th'}
        page.screenshot(path=str(artifacts / f'forgot-{theme}.png'))

        page.goto(base + '/reset-password?token=bad', wait_until='domcontentloaded')
        expect(page.get_by_role('alert')).to_contain_text('invalid')
        expect(page.locator('form')).to_have_count(0)

        page.goto(base + '/reset-password?token=' + token, wait_until='domcontentloaded')
        expect(page.get_by_role('heading', name='Set a new password')).to_be_visible()
        expect(page.locator('.kmitl-loading')).to_have_count(0)
        page.locator('#new-password').fill('first-password')
        page.locator('#confirm-password').fill('other-password')
        page.get_by_role('button', name='Update password').click()
        expect(page.locator('form [role="alert"]')).to_contain_text('do not match')
        assert len(requests) == 1
        page.locator('#new-password').fill('expired-password')
        page.locator('#confirm-password').fill('expired-password')
        page.get_by_role('button', name='Update password').click()
        expect(page.locator('form [role="alert"]')).to_contain_text('expired')
        page.locator('#new-password').fill('new-secure-password')
        page.locator('#confirm-password').fill('new-secure-password')
        page.screenshot(path=str(artifacts / f'reset-{theme}.png'))
        page.get_by_role('button', name='Update password').click()
        expect(page.get_by_role('status')).to_contain_text('Password updated')
        assert requests[-1][1] == {'token': token, 'password': 'new-secure-password'}
        assert 'token=' not in page.url
        assert not errors, errors
        print(f'PASS {theme}: login link, request, invalid/expired token, mismatch, reset success, token URL cleanup')
        context.close()
    browser.close()
print(f'Screenshots: {artifacts}')
