'use strict';

import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import St from 'gi://St'

import {panel as Panel} from 'resource:///org/gnome/shell/ui/main.js';
import {Button as PanelButton} from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

var ToggleButton = GObject.registerClass(
    {GTypeName: 'ToggleButton'},
    class ToggleButton extends PanelButton {
        _init(extensionObject) {
            super._init(0.0, `${extensionObject.metadata.name} Indicator`, false);
            this._mutterSettings = extensionObject._mutterSettings;
            this._icons = extensionObject._icons;
            this.icon = new St.Icon({style_class: "system-status-icon"});
            this.add_child(this.icon);
            this._onPressEventId = this.connect('button-press-event', this.pressAction.bind(this));
            this._onSettingChangedId = extensionObject._mutterSettings.connect('changed::workspaces-only-on-primary', this.updateIcon.bind(this));
            this.updateIcon();

            this._settings = extensionObject.getSettings();
            this._settings.bind(
                'show-in-quicksettings',
                this, 'visible',
                Gio.SettingsBindFlags.INVERT_BOOLEAN
            );
        }

        updateIcon() {
            let state = this._mutterSettings.get_boolean('workspaces-only-on-primary');
            this.icon.gicon = this._icons[state];
        }

        pressAction() {
            let current = this._mutterSettings.get_boolean('workspaces-only-on-primary');
            this._mutterSettings.set_boolean('workspaces-only-on-primary', !current);
        }

        destroy() {
            this.disconnect(this._onPressEventId);
            this._mutterSettings.disconnect(this._onSettingChangedId);
            super.destroy();
        }
    }
);

const FeatureToggle = GObject.registerClass(
    class FeatureToggle extends QuickSettings.QuickToggle {
        _init(extensionObject) {
            super._init({
                title: 'Workspaces',
                gicon: Gio.icon_new_for_string(extensionObject.path + '/icons/workspace-span-on-symbolic.svg'),
                toggleMode: true,
            });

            this._mutterSettings = extensionObject._mutterSettings;
            extensionObject._mutterSettings.bind('workspaces-only-on-primary',
                this, 'checked',
                Gio.SettingsBindFlags.INVERT_BOOLEAN);
            this._onSettingChangedId = extensionObject._mutterSettings.connect('changed::workspaces-only-on-primary', this.updateSubtitle.bind(this));
            this.updateSubtitle();

            this._settings = extensionObject.getSettings();

            this._settings.bind('show-in-quicksettings',
                this, 'visible',
                Gio.SettingsBindFlags.DEFAULT);
        }

        updateSubtitle() {
            let state = this._mutterSettings.get_boolean('workspaces-only-on-primary');
            this.subtitle = state ? 'Only on primary' : 'Span displays';
        }
    });

const FeatureIndicator = GObject.registerClass(
    class FeatureIndicator extends QuickSettings.SystemIndicator {
        _init(extensionObject) {
            super._init();

            this.quickSettingsItems.push(new FeatureToggle(extensionObject));

            this.connect('destroy', () => {
                this.quickSettingsItems.forEach(item => item.destroy());
            });
        }
    });

export default class MyExtension extends Extension {
    enable() {
        this._mutterSettings = new Gio.Settings({
            schema_id: 'org.gnome.mutter',
        });
        this._icons = {
            'true': Gio.icon_new_for_string(this.path + '/icons/workspace-span-off-symbolic.svg'),
            'false': Gio.icon_new_for_string(this.path + '/icons/workspace-span-on-symbolic.svg')
        }
        this._indicator = new FeatureIndicator(this);
        this._panelButton = new ToggleButton(this);
        Panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        Panel.addToStatusArea(this.metadata.name, this._panelButton);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
        this._panelButton.destroy();
        this._panelButton = null;
    }
}
