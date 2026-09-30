"""Browser checks for the UI gaps in test.md, against ui-audit-server.cjs only."""
from playwright.sync_api import sync_playwright, expect
from time import time
import re
from pathlib import Path

BASE = 'http://127.0.0.1:3107'
RUN = int(time() * 1000) % 899000


def fill_registration(page, suffix, name='  ทดสอบ หลาย คำ  '):
    page.goto(BASE + '/register')
    fields = {
        'studentId': f'72{RUN + suffix:06d}',
        'email': f'qa{RUN + suffix}@kmitl.ac.th',
        'name': name,
        'phone': '0812345678',
        'major': 'Computer Engineering',
        'username': f'qa{RUN + suffix}',
        'password': 'QA-only-123!',
    }
    for key, value in fields.items():
        page.locator('#' + key).fill(value)
    page.locator('#year').select_option('3')
    return fields


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel='msedge', headless=True)
    context = browser.new_context(timezone_id='Asia/Bangkok')
    context.set_default_timeout(15000)
    page = context.new_page()
    page.clock.set_fixed_time('2026-09-17T18:00:00+07:00')
    response = page.request.get(BASE + '/api/courts/availability?date=2026-09-17')
    assert response.status == 200 and isinstance(response.json(), list)
    print('PASS SET-01: frontend /api rewrite reaches isolated backend')
    admin_token = context.request.post(BASE + '/api/auth/login', data={
        'username': 'admin', 'password': 'password',
    }).json()['access_token']
    reset = context.request.post(BASE + '/api/bookings/reset', headers={
        'Authorization': 'Bearer ' + admin_token,
    })
    assert reset.status in (200, 201)

    fields = fill_registration(page, 1)
    page.locator('button[type=submit]').click()
    page.wait_for_url('**/dashboard')
    expect(page.get_by_text(fields['name'].strip(), exact=False).first).to_be_visible()
    print('PASS SMK-01 REG-01 REG-08: register, dashboard and Thai multiword name')

    page.get_by_role('button', name='Menu', exact=True).click()
    page.get_by_role('button', name='Logout', exact=False).click()
    page.wait_for_url('**/login')
    page.go_back()
    page.wait_for_url('**/login')
    page.goto(BASE + '/dashboard')
    page.wait_for_url('**/login')
    print('PASS SMK-08: logout, Back and protected deep link')

    page.locator('#username').fill(fields['username'])
    page.locator('#password').fill(fields['password'])
    page.locator('button[type=submit]').click()
    page.wait_for_url('**/dashboard')
    print('PASS REG-16: logout and login with original password')

    retry = fill_registration(page, 2)
    page.route('**/api/auth/register', lambda route: route.abort('failed'))
    page.locator('button[type=submit]').click()
    expect(page.locator('#studentId')).to_have_value(retry['studentId'])
    expect(page.locator('#password')).to_have_value(retry['password'])
    expect(page).to_have_url(BASE + '/register')
    page.unroute('**/api/auth/register')
    page.locator('button[type=submit]').click()
    page.wait_for_url('**/dashboard')
    print('PASS REG-15: failed network attempt preserves form and retry succeeds')

    rapid = fill_registration(page, 3)
    requests = []
    page.on('request', lambda request: requests.append(request) if request.url.endswith('/api/auth/register') else None)
    button = page.locator('button[type=submit]')
    button.click()
    page.locator('#password').press('Enter')
    page.wait_for_url('**/dashboard')
    assert len(requests) == 1, f'expected one request, got {len(requests)}'
    print('PASS REG-14 UI: rapid submit sends one request')

    page.goto(BASE + '/booking')
    page.get_by_title('ปิดหน้าต่างเพื่อดำเนินการจอง').click()
    page.get_by_role('button', name='18:00 - 19:00').click()
    page.get_by_role('button', name='ดำเนินการจองต่อ').click()
    page.wait_for_url('**/booking/select-court?*')
    page.locator('.court-select-btn:not([disabled])').first.click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.get_by_role('button', name='ยืนยันจองคอร์ท').click()
    page.wait_for_url('**/dashboard')
    expect(page.get_by_text('Upcoming Booking')).to_be_visible()
    print('PASS SMK-02: date, time, court and confirmation dialog create booking')

    page.get_by_role('button', name=re.compile('Cancel$')).click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.get_by_role('button', name='ยืนยันยกเลิก').click()
    expect(page.get_by_text('Upcoming Booking')).to_have_count(0)
    print('PASS SMK-05: cancel confirmation removes pending booking')

    qr_username = f'qr{RUN}'
    qr_name = f'QR Player {RUN}'
    student_login_response = context.request.post(BASE + '/api/auth/register', data={
        'studentId': f'73{RUN:06d}', 'email': f'qr{RUN}@kmitl.ac.th',
        'name': qr_name, 'phone': '0812345678', 'major': 'Computer Engineering',
        'year': '3', 'username': qr_username, 'password': 'QA-only-123!',
    })
    assert student_login_response.status == 201
    student_login = student_login_response.json()
    availability = context.request.get(BASE + '/api/courts/availability?date=2026-09-17').json()
    free = next(court['id'] for court in availability if not any(
        booking['start_time'] == '18:00:00' and booking['status'] != 'CANCELLED'
        for booking in court['bookings']))
    created = context.request.post(BASE + '/api/bookings', data={
        'courtId': free, 'date': '2026-09-17', 'startTime': '18:00:00',
    }, headers={'Authorization': 'Bearer ' + student_login['access_token']})
    assert created.status == 201

    admin_context = browser.new_context(timezone_id='Asia/Bangkok')
    admin_page = admin_context.new_page()
    admin_page.clock.set_fixed_time('2026-09-17T18:00:00+07:00')
    admin_page.goto(BASE + '/login')
    admin_page.locator('#username').fill('admin')
    admin_page.locator('#password').fill('password')
    admin_page.locator('button[type=submit]').click()
    admin_page.wait_for_url('**/dashboard')
    admin_page.get_by_text(qr_name, exact=True).click()
    qr_path = Path(__file__).with_name('blocked-ui-qr.png')
    admin_page.locator('svg[width="200"]').screenshot(path=str(qr_path))

    player_context = browser.new_context(timezone_id='Asia/Bangkok')
    player_page = player_context.new_page()
    player_page.clock.set_fixed_time('2026-09-17T18:00:00+07:00')
    player_page.goto(BASE + '/login')
    player_page.locator('#username').fill(qr_username)
    player_page.locator('#password').fill('QA-only-123!')
    player_page.locator('button[type=submit]').click()
    player_page.wait_for_url('**/dashboard')
    player_page.goto(BASE + '/scan')
    player_page.get_by_text('Scan an Image File', exact=True).click()
    player_page.locator('input[type=file]').set_input_files(str(qr_path))
    player_page.wait_for_url('**/dashboard')
    expect(player_page.get_by_text('Currently Playing')).to_be_visible()
    expect(admin_page.get_by_text('Live Session In Progress')).to_be_visible()
    qr_path.unlink()
    print('PASS SMK-03: admin QR image scan updates student and admin screens')

    browser.close()
