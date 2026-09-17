PREFIX ?= /usr/local

include lib.mk
UUID := middleclickclose@paolo.tranquilli.gmail.com
SYSTEM_INSTALL_DIR := $(PREFIX)/share/gnome-shell/extensions/$(UUID)

.PHONY: all
all: pack

# Package extension
.PHONY: pack
pack: $(UUID).shell-extension.zip

# Install extension for the local user
.PHONY: install
install: $(UUID).shell-extension.zip
	$(call cmd,install-user-extension,$(UUID).shell-extension.zip)

# Install extension system-wide at the specified prefix
.PHONY: install-system
install-system: $(UUID).shell-extension.zip
	$(call cmd,install-system-extension,$(UUID).shell-extension.zip,$(SYSTEM_INSTALL_DIR))
	$(call cmd,compile-schema,$(SYSTEM_INSTALL_DIR)/schemas)

# Update translation files - only regenerate the template if explicitly requested.
src/po/template.pot: $(if $(filter %po %pot,$(MAKECMDGOALS)),,|) \
	$(wildcard src/schemas/*.gschema.xml src/*.js)

PO_FILES := $(wildcard src/po/*.po)
$(PO_FILES): src/po/template.pot

.PHONY: po
po: $(PO_FILES)

# Check source code
.PHONY: check
check: $(UUID).shell-extension.zip .venv/bin/shexli
	@.venv/bin/shexli $(UUID).shell-extension.zip

# Install shexli
.venv/bin/shexli: .venv
	$(call cmd,py-package,shexli)

# Clean artifacts
.PHONY: clean
clean:
	$(call clean_ignored)
