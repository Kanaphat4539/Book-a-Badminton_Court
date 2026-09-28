"""Loading UI regression check against a local dev server, using only mocked APIs.

Run: python frontend/tests/loading-ui.py [http://localhost:3110]
"""
import sys
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3110'
artifacts = Path(tempfile.mkdtemp(prefix='badminton-loading-'))

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    for theme in ('light', 'dark'):
        context = browser.new_context(viewport={'width': 390 if theme == 'light' else 1280, 'height': 850})
        context.add_init_script(f"localStorage.setItem('theme', '{theme}');")
        page = context.new_page()
        page.set_default_timeout(30000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        pending = []

        def respond(route):
            path = route.request.url.split('/api/')[-1]
            if path in ('auth/login', 'auth/register'):
                data = route.request.post_data_json
                if data.get('password') == 'wrong':
                    route.fulfill(status=401, json={'message': 'Invalid credentials'})
                else:
                    route.fulfill(json={'access_token': 'test-only-token', 'user': {
                        'id': 1, 'name': 'Loading Test', 'username': 'loading-test', 'role': 'USER'
                    }})
            elif path == 'bookings/me':
                pending.append(route)
            elif path == 'users/me/ban-status':
                route.fulfill(json={'is_banned': False})
            else:
                route.fulfill(json=[])

        page.route('**/api/**', respond)
        page.goto(base + '/login', wait_until='domcontentloaded')
        overlay = page.locator('.kmitl-loading')
        expect(overlay).to_be_visible()
        expect(overlay).to_have_count(0)
        page.reload(wait_until='domcontentloaded')
        expect(overlay).to_be_visible()
        expect(overlay).to_have_count(0)
        page.locator('#username').fill('loading-test')
        page.locator('#password').fill('wrong')
        page.locator('button[type="submit"]').click()
        expect(page.get_by_text('Invalid credentials')).to_be_visible()
        expect(overlay).to_have_count(0)
        page.locator('#password').fill('test-only-password')
        page.locator('button[type="submit"]').click()
        expect(overlay).to_be_visible()
        page.wait_for_url('**/dashboard')
        page.wait_for_timeout(1200)
        expect(overlay).to_be_visible()
        assert pending, 'Dashboard request was not made'
        expected = 'rgba(24, 25, 29, 0.97)' if theme == 'dark' else 'rgba(255, 255, 255, 0.97)'
        assert page.locator('.kmitl-loading__card').evaluate('(el) => getComputedStyle(el).backgroundColor') == expected
        assert page.locator('.kmitl-loading__runner').evaluate('(el) => el.complete && el.naturalWidth > 0')
        assert page.locator('[inert]').count() == 1
        page.screenshot(path=str(artifacts / f'{theme}.png'))
        while pending:
            pending.pop().fulfill(json=[])
        expect(overlay).to_have_count(0)
        assert page.locator('[inert]').count() == 0
        page.reload(wait_until='domcontentloaded')
        expect(overlay).to_be_visible()
        page.wait_for_timeout(1000)
        assert pending
        while pending:
            pending.pop().fulfill(status=500, json={'message': 'Test failure'})
        expect(overlay).to_have_count(0)

        page.goto(base + '/register', wait_until='domcontentloaded')
        expect(overlay).to_have_count(0)
        for field, value in {
            'studentId': '66010001', 'email': 'loading-test@kmitl.ac.th',
            'name': 'Loading Test', 'phone': '0812345678', 'major': 'Computer Engineering',
            'username': 'loading-test', 'password': 'test-only-password'
        }.items():
            page.locator('#' + field).fill(value)
        page.locator('#year').select_option('3')
        page.locator('button[type="submit"]').click()
        expect(overlay).to_be_visible()
        page.wait_for_url('**/dashboard')
        page.wait_for_timeout(1000)
        assert pending
        while pending:
            pending.pop().fulfill(json=[])
        expect(overlay).to_have_count(0)
        assert not errors, errors
        print(f'PASS {theme}: refresh, login, register, failed login, delayed/failed data, theme, GIF, interaction lock')
        context.close()
    browser.close()
print(f'Screenshots: {artifacts}')
