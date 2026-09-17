
# System tools
PYTHON                  ?= python3
PIP                     ?= pip3

# Make `all` the default goal
all:
.DEFAULT_GOAL := all

# Define a target that always builds
FORCE:
.PHONY: PHONY

# Default to quiet output
quiet := quiet_
Q := @

# For make V=1, disable quiet output
ifneq ($(findstring 1,$(V)),)
  quiet :=
  Q := 
endif

# For make -s, always use silent output
ifneq ($(findstring s,$(firstword -$(MAKEFLAGS))),)
  quiet := silent_
endif

# Convenience variables
squote  := '
pound   := \#
dollar  := $$

# Escape single quote
escsq = $(subst $(squote),'\$(squote)',$1)

# Print quiet_cmd_$1
print_quiet_cmd = printf '  %-20s %s\n' \
                    '$(call escsq,$(firstword $(quiet_cmd_$1)))' \
                    '$(call escsq,$(wordlist 2,$(words $(quiet_cmd_$1)),$(quiet_cmd_$1)))';

# Print command log
silent_log_print = exec > /dev/null;
 quiet_log_print = $(if $(quiet_cmd_$1),$(print_quiet_cmd))
       log_print = printf '$(pound) ';$(or $(print_quiet_cmd),echo '(call escsq,$(cmd_$1) $@)';) \
                     echo '$(dollar) $(call escsq,$(cmd_$1))';

# Execute a command with the appropriate verbosity
raw_cmd = $(if $(cmd_$(1)),set -e;$($(quiet)log_print)$(cmd_$(1)),:)
cmd = @$(raw_cmd)

# Clean (aka rm -rf) a file or directory
quiet_cmd_clean = CLEAN $2
      cmd_clean = rm -rf '$(call escsq,$2)'

# Remove all files/directories matching a pattern
clean = @$(foreach f,$(wildcard $1), \
          $(call raw_cmd,clean,$f);)

# Remove all files/directories ignored by git
clean_ignored = @$(foreach f,$(shell git ls-files -o -i --directory -X .gitignore), \
                  $(call raw_cmd,clean,$f);)

# Install a gnome shell extension for the local user
quiet_cmd_install-user-extension = INSTALL-USER $2
      cmd_install-user-extension = gnome-extensions install --force $2

# Install a gnome shell extension for the entire system
quiet_cmd_install-system-extension = INSTALL-SYSTEM $2
      cmd_install-system-extension = mkdir -p '$(call escsq,$3)' && \
                                     unzip -q -o '$(call escsq,$2)' -d '$(call escsq,$3)'

# Compile glib schemas
quiet_cmd_compile-schema = COMPILE-SCHEMA $2
      cmd_compile-schema = glib-compile-schemas '$(call escsq,$2)'

# Package a gnome-shell extension.
quiet_cmd_pack-extension = PACK-EXTENSION $@
      cmd_pack-extension = gnome-extensions pack --force src $(addprefix --extra-source=, \
                             $(filter-out metadata.json extension.js prefs.js po/% schemas/%, \
                             $(patsubst src/%,%,$(filter src/%,$^))))

# Create dir/%.shell-extension.zip from dir/src
shell_extension_deps = $(foreach pat,$1,$(wildcard $(dir $@)src/$(pat)))
%.shell-extension.zip: $(call shell_extension_deps,*.js metadata.json po/*.po schemas/*.schema.xml)
	$(call cmd,pack-extension)

# Generate translation template
quiet_cmd_generate-pot = UPDATE-POT $@
      cmd_generate-pot = xgettext -F --from-code=UTF-8 --output=$@ $^

%.pot:
	$(call cmd,generate-pot)

# Update language translation file
quiet_cmd_generate-po = UPDATE-PO $@
      cmd_generate-po = msgmerge --quiet --backup off --update $@ $< && touch $@

%.po:
	$(call cmd,generate-po)

# Create a python virtual environment
quiet_cmd_py-venv = CREATE-VENV $@
      cmd_py-venv = $(PYTHON) -m venv $@

# Create a python virtual environment - targets under .venv/ use venv python.
.venv: PYTHON:=$(PYTHON)
.venv:
	$(call cmd,py-venv)
.venv/%: PYTHON:=.venv/bin/python
.venv/%: PIP:=.venv/bin/pip

# Install a python package
quiet_cmd_py-package = INSTALL-PACKAGE $2
      cmd_py-package = $(PIP) install -qU $2
