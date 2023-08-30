.PHONY: clean all install po pot pack

POT_SOURCE_FILES = $(wildcard src/schemas/*.gschema.xml src/*.js)

all: pack

pack:
	gnome-extensions pack --force src/

install: pack
	gnome-extensions install --force middleclickclose@paolo.tranquilli.gmail.com.shell-extension.zip

po: $(wildcard src/po/*.po)
pot: src/po/template.pot

clean:
	rm -f middleclickclose@paolo.tranquilli.gmail.com.shell-extension.zip
	rm -f src/po/template.pot

# ---

src/po/template.pot: $(POT_SOURCE_FILES)
	xgettext -F --from-code=UTF-8 --output=src/po/template.pot $(POT_SOURCE_FILES)

src/po/%.po: pot
	msgmerge --quiet --backup off --update $@ src/po/template.pot
