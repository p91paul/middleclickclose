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

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import { Workspace } from 'resource:///org/gnome/shell/ui/workspace.js'

export default class MiddleClickClose extends Extension {
	enabled = false;
	#patched = false;

	#settings;
	#close_button;
	#rearrange_delay;

	enable() {
		this.enabled = true;
		this.ensurePatched();
	}

	disable() {
		this.enabled = false;
	}

	onCloneClicked(clone, action) {
		if (this.enabled && action.get_button() == this.close_button) {
			clone._deleteAll()
			return;
		}

		clone._activate()
	}

	ensurePatched() {
		// Already patched.
		if (this.#patched)
			return;

		this.#patchClickHandler();
		this.#patchWindowRepositioningDelay();

		this.#patched = true;
	}

	#patchClickHandler() {
		// Patch _addWindowClone() to override the clicked signal handler for window clones (which
		// is what gnome calls window previews).
		const self = this;
		const _addWindowClone = Workspace.prototype._addWindowClone;
		Workspace.prototype._addWindowClone = function () {
			let clone = _addWindowClone.apply(this, arguments);

			// This relies on implementation details of both gnome and gobject. Mainly the order the
			// clone's actions are defined and the order with which signal handlers are connected on
			// the click action. Just pray this never breaks... Or that gnome moves the click
			// handler into a named function. That'd be nice too :)
			let [clickAction] = clone.get_actions();
			let id = GObject.signal_handler_find(clickAction, { signalId: 'clicked' });
			clickAction.disconnect(id);
			clickAction.connect('clicked', action => self.onCloneClicked(clone, action));

			return clone;
		}
	}

	#patchWindowRepositioningDelay() {
		// It'd be nice to just change the WINDOW_REPOSITIONING_DELAY in workspace.js, but
		// apparently that is impossible with the switch to ESM. Instead, we'll monkey-patch
		// _doRemoveWindow() and change the timeout after the fact.
		const self = this;
		const _doRemoveWindow = Workspace.prototype._doRemoveWindow;
		Workspace.prototype._doRemoveWindow = function () {
			const ret = _doRemoveWindow.apply(this, arguments);

			// Adjust the freeze delay.
			if (this._layoutFrozenId > 0
				&& this._layoutFrozenId != this._quickCloseInOverview_lastLayoutFrozenId
			) {
				const source = GLib.MainContext.default().find_source_by_id(this._layoutFrozenId);
				source.set_ready_time(source.get_time() + self.rearrange_delay * 1000);
			}

			// Need to keep the last id to avoid adjusting the layout freeze delay more than once.
			this._quickCloseInOverview_lastLayoutFrozenId = this._layoutFrozenId;

			return ret;
		};
	}

	get settings() {
		this.#settings ||= this.getSettings();
		return this.#settings;
	}

	get close_button() {
		if (this.#close_button === undefined) {
			const update = () => this.#close_button = this.settings.get_enum('close-button') + 1;
			this.settings.connect('changed::close-button', update);
			update();
		}

		return this.#close_button;
	}


	get rearrange_delay() {
		if (this.#rearrange_delay === undefined) {
			const update = () => this.#rearrange_delay = this.settings.get_int('rearrange-delay');
			this.settings.connect('changed::rearrange-delay', update);
			update();
		}

		return this.#rearrange_delay;
	}
};
