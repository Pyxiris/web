from odoo import fields, models


class ResUsers(models.Model):
    _inherit = "res.users"

    classic_theme = fields.Boolean()
    classic_theme_always = fields.Boolean("Always Enable Classic Theme")

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS + [
            "classic_theme",
            "classic_theme_always",
        ]

    @property
    def SELF_WRITEABLE_FIELDS(self):
        return super().SELF_WRITEABLE_FIELDS + [
            "classic_theme",
            "classic_theme_always",
        ]
