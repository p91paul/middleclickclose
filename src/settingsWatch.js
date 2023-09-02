export class SettingsWatch {
    #settings;
    #key_data = new Map();

    constructor(settings, ...opts) {
        this.#settings = settings;

        for (const opt of opts) {
            if (typeof opt == 'string') {
                this.#addSetting(opt, {});
            } else {
                for (const [prop_name, opts] of Object.entries(opt)) {
                    this.#addSetting(prop_name, opts)
                }
            }
        }
    }

    #addSetting(prop_name, opts) {
        let key;
        if (typeof opts == 'string') {
            key = opts;
            opts = {};
        } else {
            key = opts.key ?? prop_name.replace('_', '-');
        }

        const settings = this.#settings;
        const raw_getter = opts.get_raw ?? this.#defaultRawGetter(settings, key);
        const getter = opts.get ?? (x => x);

        const update_cb = () => {
            let value = getter(raw_getter(settings.get_value(key)));
            this.#key_data.get(prop_name).value = value;

            return value;
        };

        this.#key_data.set(prop_name, {});
        Object.defineProperty(this, prop_name, {
            enumerable: true,
            configurable: true,
            get() {
                let data = this.#key_data.get(prop_name);
                if (data.value === undefined) {
                    data.handler_id = settings.connect('changed::' + key, update_cb);
                    data.value = update_cb();
                }

                return data.value;
            }
        });
    }

    #defaultRawGetter(settings, key) {
        const schema = settings.settings_schema.get_key(key);
        const [range_ty, _range] = schema.get_range().recursiveUnpack();

        if (range_ty == "enum") {
            return value => {
                return {
                    nick: value.unpack(),

                    // FIXME: remove unnecessary lookup if/when g_settings_schema_key_to_enum()
                    // becomes available. But for now, an extra lookup will have to do.
                    value: settings.get_enum(key),
                };
            };
        }

        return value => value.recursiveUnpack();
    }

    clear() {
        for (const [key, data] of this.#key_data.entries()) {
            if (data.handler_id !== undefined)
                this.#settings.disconnect(data.handler_id);

            delete this[key];
        }

        this.#key_data.clear();
    }
}

// Allow calling clear as a static function.
SettingsWatch.clear = obj => SettingsWatch.prototype.clear.apply(obj);
