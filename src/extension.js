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
import Meta from 'gi://Meta';

import { Extension, InjectionManager }
	from 'resource:///org/gnome/shell/extensions/extension.js';
import { Workspace } from 'resource:///org/gnome/shell/ui/workspace.js';
import { WindowPreview } from 'resource:///org/gnome/shell/ui/windowPreview.js';
import { ControlsState } from 'resource:///org/gnome/shell/ui/overviewControls.js';

import { SettingsWatch } from './settingsWatch.js';

export default class MiddleClickClose extends Extension {
	#settings;
	#injectionManager;

	#refocusOnClose;

	enable() {
		this.#settings = new SettingsWatch(this.getSettings(), {
			close_button: { get: v => v.value, },
			rearrange_delay: {},
			keyboard_close: {},
		});

		this.#refocusOnClose = new WeakSet();

		this.#injectionManager = new InjectionManager();
		this.#patchClickHandler();
		this.#patchWindowRepositioningDelay();
		this.#patchKeyClose();
	}

	disable() {
		this.#injectionManager.clear();
		this.#injectionManager = null;

		this.#refocusOnClose = null;

		this.#settings.clear();
		this.#settings = null;
	}

	#patchClickHandler() {
		// Patch _addWindowClone() to override the clicked signal handler for window clones (which
		// is what gnome calls window previews).
		const settings = this.#settings;
		this.#injectionManager.overrideMethod(Workspace.prototype, '_addWindowClone',
			original => function () {
				let clone = original.apply(this, arguments);

				// This relies on implementation details of both gnome and gobject. Mainly the order
				// the clone's actions are defined and the order with which signal handlers are
				// connected on the click action. Just pray this never breaks... Or that gnome moves
				// the click handler into a named function. That'd be nice too :)
				let [clickAction] = clone.get_actions();
				let id = GObject.signal_handler_find(clickAction, { signalId: 'clicked' });
				clickAction.disconnect(id);
				clickAction.connect('clicked', action => {
					if (action.get_button() == settings.close_button) {
						clone._deleteAll();
					} else {
						clone._activate();
					}
				});

				return clone;
			}
		);
	}

	#patchWindowRepositioningDelay() {
		// It'd be nice to just change the WINDOW_REPOSITIONING_DELAY in workspace.js, but
		// apparently that is impossible with the switch to ESM. Instead, we'll monkey-patch
		// _doRemoveWindow() and change the timeout after the fact.
		const settings = this.#settings;
		const refocusOnClose = this.#refocusOnClose;
		const lastLayoutFrozenIds = new WeakMap();

		this.#injectionManager.overrideMethod(Workspace.prototype, '_doRemoveWindow',
			original => function (metaWin) {

				// Grab the old window's focus chain index.
				let focus_idx = this.get_focus_chain()
					.findIndex(clone => clone.metaWindow == metaWin);

				// Call the original method.
				const ret = original.apply(this, arguments);

				if (refocusOnClose.has(metaWin)) {
					// Find a "nearby" window to refocus to, based on the old index
					const chain = this.get_focus_chain();
					if (focus_idx >= chain.length) {
						focus_idx = chain.length - 1;
					}

					// Focus on the selected window.
					if (focus_idx >= 0) {
						global.stage.key_focus = chain[focus_idx];
					}
				}

				// Adjust the freeze delay.
				if (this._layoutFrozenId > 0
					&& this._layoutFrozenId != lastLayoutFrozenIds.get(this)
				) {
					const src = GLib.MainContext.default().find_source_by_id(this._layoutFrozenId);
					src.set_ready_time(src.get_time() + settings.rearrange_delay * 1000);
				}

				// Need to keep the last id to avoid adjusting the layout freeze delay more than
				// once.
				lastLayoutFrozenIds.set(this, this._layoutFrozenId);
				return ret;
			})
	}

	#patchKeyClose() {
		// If Meta.KeyBindingAction.CLOSE is fired in while a WindowPreview is focused, close it.
		const settings = this.#settings;
		const refocusOnClose = this.#refocusOnClose;

		function handleKeyPress(event) {

			// Keyboard close disabled in settings.
			if (!settings.keyboard_close) {
				return false;
			}

			// We only care about window picker mode.
			if (this._workspace._overviewAdjustment.value !== ControlsState.WINDOW_PICKER) {
				return false;
			}

			const action = global.display.get_keybinding_action(
				event.get_key_code(), event.get_state());
			if (action == Meta.KeyBindingAction.CLOSE) {

				if (this._workspace.metaWorkspace?.active) {
					// Imediately refocus on another window when closing via keyboard.
					refocusOnClose.add(this.metaWindow);

					// Close the window.
					this._deleteAll();
				} else {
					// Switch to the workspace the focused window is in.
					this._workspace.metaWorkspace?.activate(global.get_current_time())
				}

				return true;
			}

			return false;
		}

		this.#injectionManager.overrideMethod(WindowPreview.prototype, 'vfunc_key_press_event',
			original => function () {
				return handleKeyPress.apply(this, arguments)
					|| original.apply(this, arguments);
			}
		)
	}
};
