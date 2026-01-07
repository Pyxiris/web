# © 2022 Florian Kantelberg - initOS GmbH
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from unittest.mock import MagicMock, call

import odoo.http
from odoo.tests import common


class TestDarkMode(common.TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.request = MagicMock(env=cls.env)
        odoo.http._request_stack.push(cls.request)

    def test_dark_mode_cookies(self):
        response = MagicMock()

        # color_scheme cookie is set because the color_scheme changed
        self.env.user.dark_mode = False
        self.env.user.dark_mode_device_dependent = False
        self.request.httprequest.cookies = {"color_scheme": "dark"}
        self.env["ir.http"]._set_color_scheme(response)
        response.set_cookie.assert_called_with("color_scheme", "light")

        # color_scheme cookie isn't set because the color_scheme is the same
        response.reset_mock()
        self.request.httprequest.cookies = {"color_scheme": "light"}
        self.env["ir.http"]._set_color_scheme(response)
        response.set_cookie.assert_not_called()

        # color_scheme cookie isn't set because it's device dependent
        response.reset_mock()
        self.env.user.dark_mode_device_dependent = True
        self.request.httprequest.cookies = {"color_scheme": "light"}
        self.env["ir.http"]._set_color_scheme(response)
        response.set_cookie.assert_called_with("dark_mode_device_dependent", "true")

        # dark_mode_device_dependent cookie is set
        response.reset_mock()
        self.env.user.dark_mode_device_dependent = True
        self.request.httprequest.cookies = {"dark_mode_device_dependent": None}
        self.env["ir.http"]._set_color_scheme(response)
        assert call("color_scheme", "light") not in response.set_cookie.mock_calls

        # dark_mode_device_dependent cookie is deleted because it's
        # not device dependent anymore
        response.reset_mock()
        self.env.user.dark_mode_device_dependent = False
        self.request.httprequest.cookies = {"dark_mode_device_dependent": "true"}
        self.env["ir.http"]._set_color_scheme(response)
        response.delete_cookie.assert_called_with("dark_mode_device_dependent")
