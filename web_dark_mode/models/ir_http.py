# © 2022 Florian Kantelberg - initOS GmbH
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import models
from odoo.http import request


class IrHttp(models.AbstractModel):
    _inherit = "ir.http"

    @classmethod
    def _set_color_scheme(cls, response):
        existing_scheme_cookie = request.httprequest.cookies.get("color_scheme")
        device_dependent_scheme_cookie = request.httprequest.cookies.get(
            "dark_mode_device_dependent"
        )
        user = request.env.user
        user_pref = getattr(user, "dark_mode", None)
        user_scheme = "dark" if user_pref else "light"
        device_dependent = getattr(user, "dark_mode_device_dependent", None)

        if (not device_dependent) and existing_scheme_cookie != user_scheme:
            response.set_cookie("color_scheme", user_scheme)

        if (device_dependent) and device_dependent_scheme_cookie != "true":
            response.set_cookie("dark_mode_device_dependent", "true")
        elif (not device_dependent) and device_dependent_scheme_cookie is not None:
            response.delete_cookie("dark_mode_device_dependent")

    @classmethod
    def _post_dispatch(cls, response):
        cls._set_color_scheme(response)
        return super()._post_dispatch(response)
