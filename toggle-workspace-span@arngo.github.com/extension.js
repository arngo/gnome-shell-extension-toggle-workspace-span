'use strict';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Config = imports.misc.config;
const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

let mutterSettings = null;
try {
    mutterSettings = ExtensionUtils.getSettings('org.gnome.mutter');
} catch (e) {
    logError(e, 'Failed to load Mutter settings');
}

var ToggleButton = class ToggleButton extends PanelMenu.Button {
    getIcon(state) {
        if (state) {
            return Gio.icon_new_for_string(Me.path + '/icons/workspace-span-off-symbolic.svg');
        } else {
            return Gio.icon_new_for_string(Me.path + '/icons/workspace-span-on-symbolic.svg');
        }
    }

    _init() {
        super._init(0.0, `${Me.metadata.name} Indicator`, false);
        this.icon = new St.Icon({style_class: "system-status-icon"});
        this.updateIcon();
        this.add_child(this.icon);
        this._onPressEventId = this.connect('button-press-event', this.pressAction.bind(this));
        this._onSettingChangedId = mutterSettings.connect('changed::workspaces-only-on-primary', this.updateIcon.bind(this));
    }

    updateIcon() {
        this.icon.gicon = this.getIcon(mutterSettings.get_boolean('workspaces-only-on-primary'));
    }

    pressAction() {
        let current = mutterSettings.get_boolean('workspaces-only-on-primary');
        mutterSettings.set_boolean('workspaces-only-on-primary', !current);
        Main.overview.hide();
    }

    destroy() {
        this.disconnect(this._onPressEventId);
        this.disconnect(this._onSettingChangedId);
        super.destroy();
    }
}

// Compatibility with gnome-shell >= 3.32
if (SHELL_MINOR > 30) {
    ToggleButton = GObject.registerClass(
        {GTypeName: 'ToggleButton'},
        ToggleButton
    );
}

var button = null;

function init () {
}

function enable () {
    button = new ToggleButton();
    Main.panel.addToStatusArea(Me.metadata.name, button);
}

function disable () {
    if (button !== null) {
        button.destroy();
        button = null;
    }
}
