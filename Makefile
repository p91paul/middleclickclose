UUID := middleclickclose@paolo.tranquilli.gmail.com
POT_SOURCE_FILES := $(wildcard src/schemas/*.gschema.xml src/*.js)
SOURCE_FILES := ${POT_SOURCE_FILES} src/metadata.json
EXTRA_SOURCE_FILES := settingsWatch.js

PREFIX ?= /usr/local
EXTENSION_DIR := $(abspath ${PREFIX}/share/gnome-shell/extensions/${UUID})

all: pack

pack: ${UUID}.shell-extension.zip

install: pack
	gnome-extensions install --force ${UUID}.shell-extension.zip

install-system: pack
	mkdir -p ${EXTENSION_DIR}
	unzip -o ${UUID}.shell-extension.zip -d ${EXTENSION_DIR}
	glib-compile-schemas ${EXTENSION_DIR}/schemas

po: $(wildcard src/po/*.po)
pot: src/po/template.pot

clean:
	rm -f ${UUID}.shell-extension.zip
	rm -f src/po/template.pot

.PHONY: clean all install install-system po pot pack

# ---

${UUID}.shell-extension.zip: ${SOURCE_FILES}
	gnome-extensions pack --force src/ $(addprefix --extra-source=,${EXTRA_SOURCE_FILES})

src/po/template.pot: ${POT_SOURCE_FILES}
	xgettext -F --from-code=UTF-8 --output=src/po/template.pot ${POT_SOURCE_FILES}

src/po/%.po: pot
	msgmerge --quiet --backup off --update $@ src/po/template.pot
