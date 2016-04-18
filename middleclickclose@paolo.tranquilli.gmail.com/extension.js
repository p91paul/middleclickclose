/* This extension is a derived work of the Gnome Shell.
*
* Copyright (c) 2013 Paolo Tranquilli
*
* This extension is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* This extension is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this extension; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
*/

const CLOSE_BUTTON = 'close-button';
const REARRANGE_DELAY = 'rearrange-delay';


const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Workspace = imports.ui.workspace
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.lib;

const Init = new Lang.Class({
	Name: 'MiddleClick.Init',
	
	_init: function () {
		this._oldOnClicked = Workspace.WindowClone.prototype._onClicked;
		this._oldDoRemoveWindow = Workspace.Workspace.prototype._doRemoveWindow;
		this._settings = Lib.getSettings(Me);
		this._setCloseButton();
		this._setRearrangeDelay();
	},
	
    _connectSettings: function() {
        this._settingsSignals = [];
        this._settingsSignals.push(this._settings.connect('changed::'+CLOSE_BUTTON, Lang.bind(this, this._setCloseButton)));
        this._settingsSignals.push(this._settings.connect('changed::'+REARRANGE_DELAY, Lang.bind(this, this._setRearrangeDelay)));
	},
	
    _disconnectSettings: function() {
        while(this._settingsSignals.length > 0) {
			this._settings.disconnect(this._settingsSignals.pop());
        }
    },
    
    _setCloseButton: function() {
		this._closeButton = this._settings.get_enum(CLOSE_BUTTON) + 1;
	},
	
	_setRearrangeDelay: function() {
		this._rearrangeDelay = this._settings.get_int(REARRANGE_DELAY);
	},

	enable: function() {
		// I'll go with a closure, not sure how to do it otherwise
		let init = this;
		
		// override WindowClone's _onClicked
		Workspace.WindowClone.prototype._onClicked = function(action, actor) {
			this._selected = true;
			if (action.get_button() == init._closeButton) {
				this.metaWindow.delete(global.get_current_time());
			} else {
				init._oldOnClicked.apply(this, [action, actor]);
			}
		};

		// override Workspace's _doRemoveWindow in order to put into it the
		// parameteriseable rearrangement delay. Rather than copy the code from
		// workspace.js, we reuse it but remove the scheduled rearrangement task
		// (as its 750ms delay is hard-coded...)
		Workspace.Workspace.prototype._doRemoveWindow = function(metaWin) {
			init._oldDoRemoveWindow.apply(this, [metaWin]);

			// the rest is more or less copied from the tail of _doRemoveWindow's
			// original code

			// remove old handler
			if (this._repositionWindowsId > 0) {
				Mainloop.source_remove(this._repositionWindowsId);
				this._repositionWindowsId = 0;
			}

			// setup new handler
			let [x, y, mask] = global.get_pointer();
			this._cursorX = x;
			this._cursorY = y;

			// this is the bit that changes
			//always more than 0ms
			this._repositionWindowsId = Mainloop.timeout_add(Math.max(init._rearrangeDelay,1),
								Lang.bind(this, this._delayedWindowRepositioning));
		};
		
		this._connectSettings();
	},

	disable: function() {
		Workspace.WindowClone.prototype._onClicked = this._oldOnClicked;
		Workspace.Workspace.prototype._doRemoveWindow = this._oldDoRemoveWindow;
		this._disconnectSettings();
	}
});

function init() {
    Lib.initTranslations(Me);
	return new Init();
}
