from odoo import models
from odoo.http import request


class IrHttp(models.AbstractModel):
    _inherit = "ir.http"

    @classmethod
    def _set_classic_theme(cls, response):
        theme = request.httprequest.cookies.get("classic_theme")
        user = request.env.user
        user_theme = "classic" if getattr(user, "classic_theme", None) else "pure"
        user_theme_always = getattr(user, "classic_theme_always", None)
        if (not user_theme_always) and theme != user_theme:
            response.set_cookie("classic_theme", user_theme)

    @classmethod
    def _post_dispatch(cls, response):
        cls._set_classic_theme(response)
        return super()._post_dispatch(response)
