'use strict';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

var ToggleButton = GObject.registerClass(
    {GTypeName: 'ToggleButton'},
    class ToggleButton extends PanelMenu.Button {
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
            this.add_child(this.icon);
            this.mutterSettings = ExtensionUtils.getSettings('org.gnome.mutter');
            this._onPressEventId = this.connect('button-press-event', this.pressAction.bind(this));
            this._onSettingChangedId = this.mutterSettings.connect('changed::workspaces-only-on-primary', this.updateIcon.bind(this));
            this.updateIcon();
        }

        updateIcon() {
            this.icon.gicon = this.getIcon(this.mutterSettings.get_boolean('workspaces-only-on-primary'));
        }

        pressAction() {
            let current = this.mutterSettings.get_boolean('workspaces-only-on-primary');
            this.mutterSettings.set_boolean('workspaces-only-on-primary', !current);
        }

        destroy() {
            this.disconnect(this._onPressEventId);
            this.disconnect(this._onSettingChangedId);
            super.destroy();
        }
    }
);

const FeatureToggle = GObject.registerClass(
class FeatureToggle extends QuickSettings.QuickToggle {
    _init() {
        super._init({
            label: 'Workspaces',
            gicon: Gio.icon_new_for_string(Me.path + '/icons/workspace-span-on-symbolic.svg'),
            toggleMode: true,
        });

        this.mutterSettings = ExtensionUtils.getSettings('org.gnome.mutter');

        this.mutterSettings.bind('workspaces-only-on-primary',
            this, 'checked',
            Gio.SettingsBindFlags.INVERT_BOOLEAN);

        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.toggle-workspace-span');

        this._settings.bind('show-in-quicksettings',
            this, 'visible',
            Gio.SettingsBindFlags.DEFAULT);
    }
});

const FeatureIndicator = GObject.registerClass(
class FeatureIndicator extends QuickSettings.SystemIndicator {
    _init() {
        super._init();

        this.quickSettingsItems.push(new FeatureToggle());
        
        this.connect('destroy', () => {
            this.quickSettingsItems.forEach(item => item.destroy());
        });
        
        QuickSettingsMenu._addItems(this.quickSettingsItems);
    }
});

class Extension {
    constructor() {
        this._indicator = null;
        this._panelButton = null;
    }
    
    enable() {
        this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.toggle-workspace-span');

        this._indicator = new FeatureIndicator();
        this._panelButton = new ToggleButton();

        this.settings.bind(
            'show-in-quicksettings',
            this._panelButton,
            'visible',
            Gio.SettingsBindFlags.INVERT_BOOLEAN
        );

        Main.panel.addToStatusArea(Me.metadata.name, this._panelButton);
    }
    
    disable() {
        this._indicator.destroy();
        this._indicator = null;
        this._panelButton.destroy();
        this._panelButton = null;
    }
}

function init () {
    return new Extension();
}
