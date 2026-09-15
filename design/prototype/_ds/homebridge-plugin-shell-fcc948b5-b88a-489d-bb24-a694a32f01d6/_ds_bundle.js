/* @ds-bundle: {"format":4,"namespace":"HomebridgePluginShell_fcc948","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"InlineConfirm","sourcePath":"components/actions/InlineConfirm.jsx"},{"name":"Block","sourcePath":"components/fields/Block.jsx"},{"name":"CheckField","sourcePath":"components/fields/CheckField.jsx"},{"name":"Field","sourcePath":"components/fields/Field.jsx"},{"name":"HelpText","sourcePath":"components/fields/HelpText.jsx"},{"name":"ListField","sourcePath":"components/fields/ListField.jsx"},{"name":"Note","sourcePath":"components/fields/Note.jsx"},{"name":"PasswordField","sourcePath":"components/fields/PasswordField.jsx"},{"name":"Preview","sourcePath":"components/fields/Preview.jsx"},{"name":"SegmentedField","sourcePath":"components/fields/SegmentedField.jsx"},{"name":"SelectField","sourcePath":"components/fields/SelectField.jsx"},{"name":"Step","sourcePath":"components/fields/Step.jsx"},{"name":"TextField","sourcePath":"components/fields/TextField.jsx"},{"name":"TextareaField","sourcePath":"components/fields/TextareaField.jsx"},{"name":"Badge","sourcePath":"components/shell/Badge.jsx"},{"name":"Banner","sourcePath":"components/shell/Banner.jsx"},{"name":"Card","sourcePath":"components/shell/Card.jsx"},{"name":"ChooserTiles","sourcePath":"components/shell/ChooserTiles.jsx"},{"name":"CreditFooter","sourcePath":"components/shell/CreditFooter.jsx"},{"name":"Disclosure","sourcePath":"components/shell/Disclosure.jsx"},{"name":"DraftBar","sourcePath":"components/shell/DraftBar.jsx"},{"name":"Grid","sourcePath":"components/shell/Grid.jsx"},{"name":"GridCell","sourcePath":"components/shell/Grid.jsx"},{"name":"FocusField","sourcePath":"components/shell/IssuesSummary.jsx"},{"name":"IssuesSummary","sourcePath":"components/shell/IssuesSummary.jsx"},{"name":"Modal","sourcePath":"components/shell/Modal.jsx"},{"name":"QrBlock","sourcePath":"components/shell/QrBlock.jsx"},{"name":"ResetDialog","sourcePath":"components/shell/ResetDialog.jsx"},{"name":"SectionHeading","sourcePath":"components/shell/SectionHeading.jsx"},{"name":"StatusBox","sourcePath":"components/shell/StatusBox.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"91712ecaf29f","components/actions/InlineConfirm.jsx":"345d16fe4c5c","components/fields/Block.jsx":"4d2016744150","components/fields/CheckField.jsx":"aa05319f24c1","components/fields/Field.jsx":"858ba1e76bfe","components/fields/HelpText.jsx":"a8eb88d29b73","components/fields/ListField.jsx":"f83ae69c3561","components/fields/Note.jsx":"f75112c1c14d","components/fields/PasswordField.jsx":"2ccc9e0be648","components/fields/Preview.jsx":"8d52797c663f","components/fields/SegmentedField.jsx":"1c0147695161","components/fields/SelectField.jsx":"548974a46452","components/fields/Step.jsx":"eadebfeecde5","components/fields/TextField.jsx":"30b478c3ae1b","components/fields/TextareaField.jsx":"985a9d8fc928","components/shell/Badge.jsx":"cd2b46299d23","components/shell/Banner.jsx":"881d397e0bbe","components/shell/Card.jsx":"0924b839f85c","components/shell/ChooserTiles.jsx":"833a6dcc2afe","components/shell/CreditFooter.jsx":"8d3390be0b6f","components/shell/Disclosure.jsx":"bfe968c0c700","components/shell/DraftBar.jsx":"95d3afd81afe","components/shell/Grid.jsx":"a5971f7ad572","components/shell/IssuesSummary.jsx":"304171092146","components/shell/Modal.jsx":"0b246ba738e3","components/shell/QrBlock.jsx":"11e0cf0f7620","components/shell/ResetDialog.jsx":"40c185afd916","components/shell/SectionHeading.jsx":"60d5d5a0525a","components/shell/StatusBox.jsx":"3808c8a1ccfa","ui_kits/notify-switch/App.jsx":"57dae43befd2","ui_kits/notify-switch/GroupsSwitchesSettings.jsx":"246562164e73","ui_kits/notify-switch/Providers.jsx":"077f39da6626"},"inlinedExternals":[],"unexposedExports":[{"name":"controlIcons","sourcePath":"components/fields/TextField.jsx"},{"name":"controlStyle","sourcePath":"components/fields/TextField.jsx"},{"name":"focusField","sourcePath":"components/shell/IssuesSummary.jsx"},{"name":"useFieldState","sourcePath":"components/fields/Field.jsx"},{"name":"useNarrow","sourcePath":"components/fields/SegmentedField.jsx"}]} */

(() => {

const __ds_ns = (window.HomebridgePluginShell_fcc948 = window.HomebridgePluginShell_fcc948 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const base = {
  fontFamily: 'var(--font-sans)',
  borderRadius: 'var(--radius-button)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  border: '1px solid transparent',
  background: 'transparent',
  color: 'inherit',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'background-color .15s ease, color .15s ease, border-color .15s ease'
};
const sm = {
  minHeight: 'var(--button-sm-height)',
  padding: '4px 8px',
  fontSize: 'var(--text-btn-sm-size)',
  lineHeight: 'var(--text-btn-sm-line)',
  textTransform: 'uppercase',
  fontWeight: 400
};
const add = {
  minHeight: 'var(--button-add-height)',
  padding: '6px 12px',
  fontSize: 'var(--text-btn-add-size)',
  lineHeight: '24px',
  textTransform: 'uppercase',
  fontWeight: 400
};
const link = {
  padding: 0,
  minHeight: 0,
  fontSize: 'inherit',
  lineHeight: 'inherit',
  textTransform: 'none',
  border: 0,
  whiteSpace: 'normal',
  textAlign: 'left'
};

/**
 * Shell button. variant: add (38px filled primary, the one per section), outline (31px outlined secondary: Add row, Cancel, Show/Hide),
 * footer (31px outlined link-colour: Test connection / Test send), danger (31px filled red: confirm Remove), link (text button),
 * dangerLink (red text button: Remove, Reset), secondaryLink (secondary text button: Show help). `attached` joins it to a 38px control.
 */
function Button({
  variant = 'outline',
  children,
  disabled,
  onClick,
  href,
  attached,
  style,
  title,
  type = 'button',
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  let s = {
    ...base
  };
  if (variant === 'add') {
    s = {
      ...s,
      ...add,
      background: hover ? 'var(--ns-primary-hover)' : 'var(--ns-primary)',
      borderColor: hover ? 'var(--ns-primary-hover)' : 'var(--ns-primary)',
      color: 'var(--ns-button-fg)'
    };
    if (disabled) s = {
      ...s,
      background: 'transparent',
      borderColor: 'var(--ns-border)',
      color: 'var(--ns-secondary)'
    };
  } else if (variant === 'outline') {
    s = {
      ...s,
      ...sm,
      borderColor: 'var(--ns-badge)',
      color: 'var(--ns-badge)',
      background: active ? 'var(--ns-press-wash)' : hover ? 'var(--ns-hover-wash)' : 'transparent'
    };
    if (attached) s = {
      ...s,
      minHeight: 'var(--control-height)',
      borderRadius: '0 var(--radius-control) var(--radius-control) 0',
      marginLeft: '-1px',
      borderColor: 'var(--ns-badge)'
    };
  } else if (variant === 'footer') {
    s = {
      ...s,
      ...sm,
      borderColor: 'var(--ns-link)',
      color: 'var(--ns-link)',
      background: active ? 'var(--ns-press-wash)' : hover ? 'var(--ns-hover-wash)' : 'transparent'
    };
  } else if (variant === 'danger') {
    s = {
      ...s,
      ...sm,
      background: hover ? '#bb2d3b' : 'var(--ns-danger)',
      borderColor: 'var(--ns-danger)',
      color: '#fff'
    };
  } else if (variant === 'link') {
    s = {
      ...s,
      ...link,
      color: 'var(--ns-link)',
      textDecoration: hover ? 'underline' : 'none'
    };
  } else if (variant === 'dangerLink') {
    s = {
      ...s,
      ...link,
      color: 'var(--ns-danger)',
      textDecoration: hover ? 'underline' : 'none'
    };
  } else if (variant === 'secondaryLink') {
    s = {
      ...s,
      ...link,
      color: 'var(--ns-secondary)',
      textDecoration: hover ? 'underline' : 'none'
    };
  }
  if (disabled) s = {
    ...s,
    cursor: 'not-allowed',
    color: 'var(--ns-secondary)',
    background: 'transparent',
    borderColor: variant.endsWith('ink') || variant === 'link' ? 'transparent' : 'var(--ns-border)'
  };
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false)
  };
  if (href) return /*#__PURE__*/React.createElement("a", _extends({
    href: href,
    target: "_blank",
    rel: "noopener noreferrer",
    role: "button",
    style: {
      ...s,
      ...style
    },
    title: title
  }, handlers, rest), children);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
      ...s,
      ...style
    },
    title: title
  }, handlers, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/InlineConfirm.jsx
try { (() => {
const {
  useEffect,
  useState
} = React;
/**
 * In-place confirmation (C5): the start button is replaced by "{question}" + confirm + Cancel. Escape or Cancel
 * restores the button; the confirm button takes focus when it opens. Used by Remove and Test send.
 */
function InlineConfirm({
  label,
  question,
  confirmLabel = 'Remove',
  confirmVariant = 'danger',
  startVariant = 'dangerLink',
  cancelLabel = 'Cancel',
  onConfirm,
  disabled,
  title
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: startVariant,
    disabled: disabled,
    title: title,
    onClick: () => setOpen(true)
  }, label);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-help-size)'
    }
  }, question), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: confirmVariant,
    autoFocus: true,
    onClick: () => {
      setOpen(false);
      onConfirm && onConfirm();
    }
  }, confirmLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "link",
    onClick: () => setOpen(false)
  }, cancelLabel));
}
Object.assign(__ds_scope, { InlineConfirm });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/InlineConfirm.jsx", error: String((e && e.message) || e) }); }

// components/fields/HelpText.jsx
try { (() => {
/** One line of field help (12.6px secondary, line 1.4) with an optional trailing link. Carries `ns-help` so a card's help toggle can hide it. */
function HelpText({
  children,
  link,
  linkHref,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ns-help",
    style: {
      fontSize: 'var(--text-help-size)',
      lineHeight: 'var(--text-help-line)',
      color: 'var(--ns-secondary)',
      marginTop: '4px',
      ...style
    }
  }, children, link ? /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement("a", {
    href: linkHref || '#',
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: 'var(--ns-link)',
      textDecoration: 'underline'
    }
  }, link)) : null);
}
Object.assign(__ds_scope, { HelpText });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/HelpText.jsx", error: String((e && e.message) || e) }); }

// components/fields/Block.jsx
try { (() => {
/** Block sub-heading: bold 14.4px label with a caption, grouping the checks/lists that follow (Recipients, Extra recipients, Send by). */
function Block({
  label,
  help,
  children,
  captionBelow,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '8px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--text-label-weight)',
      marginBottom: '4px'
    }
  }, label), !captionBelow && help ? /*#__PURE__*/React.createElement(__ds_scope.HelpText, {
    style: {
      marginTop: 0,
      marginBottom: '8px'
    }
  }, help) : null, children, captionBelow && help ? /*#__PURE__*/React.createElement(__ds_scope.HelpText, {
    style: {
      marginTop: 0,
      marginBottom: '16px'
    }
  }, help) : null);
}
Object.assign(__ds_scope, { Block });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/Block.jsx", error: String((e && e.message) || e) }); }

// components/fields/CheckField.jsx
try { (() => {
/** 16px checkbox with a 14.4px label and a caption under the label. `compact` drops the 16px bottom margin (Send by rows, group ticks). */
function CheckField({
  id,
  label,
  checked,
  defaultChecked,
  onChange,
  help,
  helpLink,
  helpLinkHref,
  disabled,
  compact,
  dim,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: compact ? '4px' : 'var(--field-gap)',
      display: 'block',
      minHeight: '24px',
      paddingLeft: '24px',
      position: 'relative',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: id,
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      left: 0,
      top: '4px',
      width: 'var(--checkbox-size)',
      height: 'var(--checkbox-size)',
      margin: 0,
      accentColor: 'var(--ns-link)',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      opacity: dim ? 0.65 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }, label), help ? /*#__PURE__*/React.createElement(__ds_scope.HelpText, {
    link: helpLink,
    linkHref: helpLinkHref,
    style: {
      marginTop: '2px'
    }
  }, help) : null);
}
Object.assign(__ds_scope, { CheckField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/CheckField.jsx", error: String((e && e.message) || e) }); }

// components/fields/Field.jsx
try { (() => {
const {
  useEffect,
  useRef,
  useState
} = React;
/**
 * Label row (14.4px 600, red * when required, optional right-aligned extra) + control + help + validation message
 * (the message sits under the help, as `.invalid-feedback` does in the source). 16px below. When a message shows, the
 * wrapper dispatches a bubbling `ns-invalid` event so an enclosing Disclosure opens itself.
 */
function Field({
  id,
  label,
  required,
  labelExtra,
  help,
  helpLink,
  helpLinkHref,
  error,
  children,
  style,
  className
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (error && ref.current) ref.current.dispatchEvent(new CustomEvent('ns-invalid', {
      bubbles: true
    }));
  }, [error]);
  const lab = /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      fontWeight: 'var(--text-label-weight)',
      marginBottom: '4px',
      display: 'inline-block'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: 'var(--ns-danger)',
      marginLeft: '4px'
    }
  }, "*") : null);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: className,
    "data-field": id,
    style: {
      marginBottom: 'var(--field-gap)',
      ...style
    }
  }, labelExtra ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: '8px'
    }
  }, lab, labelExtra) : lab, children, help ? /*#__PURE__*/React.createElement(__ds_scope.HelpText, {
    link: helpLink,
    linkHref: helpLinkHref
  }, help) : null, error ? /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      fontSize: 'var(--text-help-size)',
      lineHeight: 'var(--text-help-line)',
      color: 'var(--ns-danger)',
      marginTop: '4px'
    }
  }, error) : null);
}

/**
 * Touched-state validation (F2, W4): a field validates when it loses focus, never on keystroke. Returns the value to
 * show, the message ("{Label} is required." from the field's own label while empty) and the green-check state. An
 * `error` passed in always wins; `valid` passed in forces the check.
 */
function useFieldState({
  label,
  required,
  value,
  defaultValue,
  error,
  valid,
  onChange,
  validate = true
}) {
  const [val, setVal] = useState(value !== undefined ? value : defaultValue || '');
  const [touched, setTouched] = useState(false);
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (value !== undefined) setVal(value);
  }, [value]);
  const current = value !== undefined ? value : val;
  const empty = String(current == null ? '' : current).trim() === '';
  const shownError = error || (validate && touched && required && empty ? `${label} is required.` : undefined);
  const shownValid = valid || validate && touched && !shownError && !empty;
  return {
    current,
    focus,
    shownError,
    shownValid,
    change: v => {
      setVal(v);
      onChange && onChange(v);
    },
    onFocus: () => setFocus(true),
    onBlur: () => {
      setFocus(false);
      setTouched(true);
    },
    touch: () => setTouched(true)
  };
}
Object.assign(__ds_scope, { Field, useFieldState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/Field.jsx", error: String((e && e.message) || e) }); }

// components/fields/Note.jsx
try { (() => {
/** Caption-only row (12.6px secondary) with optional link. Used for provider notes ("US numbers must be registered…"). */
function Note({
  children,
  link,
  linkHref,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.HelpText, {
    link: link,
    linkHref: linkHref,
    style: {
      marginTop: 0,
      marginBottom: 'var(--field-gap)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Note });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/Note.jsx", error: String((e && e.message) || e) }); }

// components/fields/Preview.jsx
try { (() => {
/** Preview line: 14.4px text with a 3px left rule ("Will send SMS via Twilio to 4 numbers…"). */
function Preview({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      borderLeft: '3px solid var(--ns-border)',
      marginBottom: 'var(--field-gap)',
      lineHeight: 1.5,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Preview });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/Preview.jsx", error: String((e && e.message) || e) }); }

// components/fields/Step.jsx
try { (() => {
/** Numbered step panel (Telegram onboarding): 1px rule, 6px radius, 12px padding; 24px numbered disc on the locked fill, bold label, caption, then children. */
function Step({
  number,
  title,
  help,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--ns-border)',
      borderRadius: 'var(--radius-control)',
      padding: 'var(--panel-padding)',
      marginBottom: '12px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      minWidth: 'var(--step-disc-size)',
      height: 'var(--step-disc-size)',
      lineHeight: 'var(--step-disc-size)',
      borderRadius: '12px',
      textAlign: 'center',
      background: 'var(--ns-locked)',
      fontSize: 'var(--text-step-number-size)',
      fontWeight: 400
    }
  }, number), /*#__PURE__*/React.createElement("span", null, title)), help ? /*#__PURE__*/React.createElement(__ds_scope.HelpText, {
    style: {
      marginTop: 0,
      marginBottom: children ? '12px' : 0
    }
  }, help) : null, children);
}
Object.assign(__ds_scope, { Step });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/Step.jsx", error: String((e && e.message) || e) }); }

// components/fields/TextField.jsx
try { (() => {
const {
  useRef
} = React;
const check = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e\")";
/* Bootstrap's `.is-invalid` icon, drawn inside the control (F3). */
const cross = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e\")";

/** Shared 38px control styling: 6px radius, 11px side padding, 16px text. `invalid` draws the red border and icon; `valid` the green check; `locked` the readonly look. */
function controlStyle({
  focus,
  invalid,
  valid,
  locked,
  mono,
  extra
} = {}) {
  const icon = invalid ? cross : valid ? check : null;
  return {
    display: 'block',
    width: '100%',
    minHeight: 'var(--control-height)',
    padding: '6px var(--control-side-padding)',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
    fontSize: 'var(--text-control-size)',
    lineHeight: 'var(--text-control-line)',
    fontWeight: 400,
    color: locked ? 'inherit' : 'var(--ns-text)',
    background: locked ? 'var(--ns-locked)' : 'var(--ns-bg)',
    border: `1px solid ${invalid ? 'var(--ns-danger)' : focus ? 'var(--ns-link)' : 'var(--ns-border)'}`,
    borderRadius: 'var(--radius-control)',
    outline: 'none',
    boxShadow: focus ? `0 0 0 4px ${invalid ? 'rgba(220,53,69,.25)' : 'var(--ns-focus-ring)'}` : 'none',
    transition: 'border-color .15s ease-in-out, box-shadow .15s ease-in-out',
    ...(icon ? {
      backgroundImage: icon,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 11px center',
      backgroundSize: '16px 16px',
      paddingRight: '36px'
    } : {}),
    ...extra
  };
}
const controlIcons = {
  check,
  cross
};

/**
 * text / number / time input with the shell's field wrapper. Validates on blur (F2): an empty required field reads
 * "{Label} is required."; a touched field with a value shows the green check. `readonly` shows an Edit link and the
 * locked look; Edit unlocks, focuses and selects the value (F6).
 */
function TextField({
  id,
  label,
  required,
  value,
  defaultValue,
  onChange,
  placeholder,
  type = 'text',
  help,
  helpLink,
  helpLinkHref,
  error,
  valid,
  readonly,
  mono,
  labelExtra,
  min,
  max,
  style,
  onBlur,
  validate = true
}) {
  const st = __ds_scope.useFieldState({
    label,
    required,
    value,
    defaultValue,
    error,
    valid,
    onChange,
    validate
  });
  const [locked, setLocked] = React.useState(!!readonly);
  const ref = useRef(null);
  const unlock = () => {
    setLocked(false);
    requestAnimationFrame(() => {
      ref.current && ref.current.focus();
      ref.current && ref.current.select();
    });
  };
  const extra = readonly ? locked ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: unlock,
    "aria-label": `Edit ${label}`,
    style: {
      background: 'none',
      border: 0,
      padding: 0,
      font: 'inherit',
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-link)',
      cursor: 'pointer'
    }
  }, "Edit") : null : labelExtra;
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    id: id,
    label: label,
    required: required,
    labelExtra: extra,
    help: help,
    helpLink: helpLink,
    helpLinkHref: helpLinkHref,
    error: st.shownError,
    style: style
  }, /*#__PURE__*/React.createElement("input", {
    ref: ref,
    id: id,
    type: type,
    value: st.current,
    onChange: e => st.change(e.target.value),
    placeholder: placeholder,
    readOnly: locked,
    min: min,
    max: max,
    autoComplete: "off",
    spellCheck: false,
    onFocus: st.onFocus,
    onBlur: () => {
      st.onBlur();
      onBlur && onBlur();
    },
    className: "ns-control",
    style: controlStyle({
      focus: st.focus,
      invalid: !!st.shownError,
      valid: st.shownValid && !locked,
      locked,
      mono
    })
  }));
}
Object.assign(__ds_scope, { controlStyle, controlIcons, TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/TextField.jsx", error: String((e && e.message) || e) }); }

// components/fields/ListField.jsx
try { (() => {
const {
  useState
} = React;
/** List field: rows of (input + 31px REMOVE), "None yet." when empty, then an outlined add button. Rows with `storedAs` show a green "Stored as +1…" line. */
function ListField({
  id,
  label,
  required,
  items = [],
  onChange,
  addLabel = 'Add',
  placeholder,
  help,
  helpLink,
  helpLinkHref,
  error,
  style
}) {
  const [rows, setRows] = useState(items);
  const set = next => {
    setRows(next);
    onChange && onChange(next);
  };
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    id: id,
    label: label,
    required: required,
    help: help,
    helpLink: helpLink,
    helpLinkHref: helpLinkHref,
    error: error,
    style: style
  }, rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ns-secondary)',
      marginBottom: '8px'
    }
  }, "None yet.") : null, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      marginBottom: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: r.value,
    placeholder: placeholder,
    onChange: e => set(rows.map((x, n) => n === i ? {
      ...x,
      value: e.target.value
    } : x)),
    style: {
      ...__ds_scope.controlStyle({}),
      flex: '1 1 auto',
      minWidth: 0
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "outline",
    style: {
      minHeight: 'var(--control-height)'
    },
    onClick: () => set(rows.filter((_, n) => n !== i))
  }, "Remove")), r.storedAs ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-help-size)',
      lineHeight: 'var(--text-help-line)',
      color: 'var(--ns-success)',
      marginTop: '4px'
    }
  }, "Stored as ", r.storedAs) : null)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "outline",
    onClick: () => set([...rows, {
      value: ''
    }])
  }, addLabel));
}
Object.assign(__ds_scope, { ListField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/ListField.jsx", error: String((e && e.message) || e) }); }

// components/fields/PasswordField.jsx
try { (() => {
/** Password input with an attached SHOW / HIDE button. Monospace value; the toggle only flips the input type. Validates on blur like TextField. */
function PasswordField({
  id,
  label,
  required = true,
  value,
  defaultValue,
  onChange,
  placeholder,
  help,
  helpLink,
  helpLinkHref,
  error,
  valid,
  style
}) {
  const st = __ds_scope.useFieldState({
    label,
    required,
    value,
    defaultValue,
    error,
    valid,
    onChange
  });
  const [shown, setShown] = React.useState(false);
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    id: id,
    label: label,
    required: required,
    help: help,
    helpLink: helpLink,
    helpLinkHref: helpLinkHref,
    error: st.shownError,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("input", {
    id: id,
    type: shown ? 'text' : 'password',
    value: st.current,
    onChange: e => st.change(e.target.value),
    placeholder: placeholder,
    autoComplete: "new-password",
    spellCheck: false,
    onFocus: st.onFocus,
    onBlur: st.onBlur,
    style: {
      ...__ds_scope.controlStyle({
        focus: st.focus,
        invalid: !!st.shownError,
        valid: st.shownValid,
        mono: true
      }),
      flex: '1 1 auto',
      minWidth: 0,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      position: 'relative',
      zIndex: st.focus ? 1 : 0
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "outline",
    attached: true,
    onClick: () => setShown(!shown),
    "aria-label": `${shown ? 'Hide' : 'Show'} ${label}`
  }, shown ? 'Hide' : 'Show')));
}
Object.assign(__ds_scope, { PasswordField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/PasswordField.jsx", error: String((e && e.message) || e) }); }

// components/fields/SelectField.jsx
try { (() => {
const {
  useState
} = React;
const chevron = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")";

/** Native select in the 38px control. `options`: [{value,label,disabled}] or strings. `readonly` locks it (mail-provider presets). A select is touched on change; `error` draws the invalid icon beside the chevron. */
function SelectField({
  id,
  label,
  required,
  value,
  defaultValue,
  onChange,
  options = [],
  help,
  helpLink,
  helpLinkHref,
  error,
  valid,
  readonly,
  placeholder,
  style
}) {
  const [focus, setFocus] = useState(false);
  const icon = error ? __ds_scope.controlIcons.cross : valid ? __ds_scope.controlIcons.check : null;
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    id: id,
    label: label,
    required: required,
    help: help,
    helpLink: helpLink,
    helpLinkHref: helpLinkHref,
    error: error,
    style: style
  }, /*#__PURE__*/React.createElement("select", {
    id: id,
    value: value,
    defaultValue: defaultValue,
    disabled: readonly,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      ...__ds_scope.controlStyle({
        focus,
        invalid: !!error,
        locked: readonly
      }),
      appearance: 'none',
      WebkitAppearance: 'none',
      backgroundImage: icon ? `${chevron}, ${icon}` : chevron,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: icon ? 'right 12px center, right 36px center' : 'right 12px center',
      backgroundSize: icon ? '16px 12px, 16px 16px' : '16px 12px',
      paddingRight: icon ? '66px' : '36px',
      opacity: 1,
      cursor: readonly ? 'default' : 'pointer'
    }
  }, placeholder ? /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder) : null, options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v,
      disabled: o.disabled
    }, l);
  })));
}
Object.assign(__ds_scope, { SelectField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/SelectField.jsx", error: String((e && e.message) || e) }); }

// components/fields/SegmentedField.jsx
try { (() => {
const {
  useEffect,
  useState
} = React;
/** True below 600px (the shell's phone breakpoint); `override` forces it for previews. */
function useNarrow(override) {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 599.98px)').matches : false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 599.98px)');
    const on = () => setNarrow(mq.matches);
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on);
  }, []);
  return override !== undefined ? override : narrow;
}

/**
 * Segmented picker (T4, the SMTP "Mail provider" preset picker): a row of outlined 31px segments that fill the width,
 * the chosen one filled (a selection, not a hover), keeping its case and size; below 600px the same options render as
 * a dropdown bound to the same value. `narrow` overrides the media query.
 */
function SegmentedField({
  id,
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  help,
  helpLink,
  helpLinkHref,
  narrow,
  style
}) {
  const isNarrow = useNarrow(narrow);
  const [val, setVal] = useState(value !== undefined ? value : defaultValue);
  useEffect(() => {
    if (value !== undefined) setVal(value);
  }, [value]);
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const pick = v => {
    setVal(v);
    onChange && onChange(v);
  };
  if (isNarrow) return /*#__PURE__*/React.createElement(__ds_scope.SelectField, {
    id: id,
    label: label,
    options: opts,
    value: val,
    onChange: pick,
    help: help,
    helpLink: helpLink,
    helpLinkHref: helpLinkHref,
    style: style
  });
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    id: id,
    label: label,
    help: help,
    helpLink: helpLink,
    helpLinkHref: helpLinkHref,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    role: "group",
    "aria-label": label,
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      width: '100%'
    }
  }, opts.map((o, i) => /*#__PURE__*/React.createElement(Segment, {
    key: o.value,
    option: o,
    checked: o.value === val,
    first: i === 0,
    last: i === opts.length - 1,
    onPick: () => pick(o.value)
  }))));
}
function Segment({
  option,
  checked,
  first,
  last,
  onPick
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const bg = checked ? 'var(--ns-badge)' : active ? 'var(--ns-press-wash)' : hover ? 'var(--ns-hover-wash)' : 'transparent';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "radio",
    "aria-checked": checked,
    onClick: onPick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      flex: '1 1 auto',
      minHeight: 'var(--button-sm-height)',
      padding: '4px 8px',
      font: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      textTransform: 'none',
      color: checked ? 'var(--ns-button-fg)' : 'inherit',
      background: bg,
      border: '1px solid var(--ns-badge)',
      marginLeft: first ? 0 : '-1px',
      borderRadius: `${first ? 'var(--radius-button)' : 0} ${last ? 'var(--radius-button)' : 0} ${last ? 'var(--radius-button)' : 0} ${first ? 'var(--radius-button)' : 0}`,
      cursor: 'pointer',
      position: 'relative',
      zIndex: checked ? 1 : 0,
      transition: 'background-color .15s ease, color .15s ease'
    }
  }, option.label);
}
Object.assign(__ds_scope, { useNarrow, SegmentedField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/SegmentedField.jsx", error: String((e && e.message) || e) }); }

// components/fields/TextareaField.jsx
try { (() => {
/** 3-row textarea (Message). Optional `counter` line ("62 characters, 70 of 160 used, 1 segment") renders above the help. Validates on blur like TextField. */
function TextareaField({
  id,
  label,
  required,
  value,
  defaultValue,
  onChange,
  placeholder,
  rows = 3,
  help,
  helpLink,
  helpLinkHref,
  error,
  valid,
  labelExtra,
  counter,
  style
}) {
  const st = __ds_scope.useFieldState({
    label,
    required,
    value,
    defaultValue,
    error,
    valid,
    onChange
  });
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    id: id,
    label: label,
    required: required,
    labelExtra: labelExtra,
    help: help,
    helpLink: helpLink,
    helpLinkHref: helpLinkHref,
    error: st.shownError,
    style: style
  }, /*#__PURE__*/React.createElement("textarea", {
    id: id,
    rows: rows,
    value: st.current,
    onChange: e => st.change(e.target.value),
    placeholder: placeholder,
    onFocus: st.onFocus,
    onBlur: st.onBlur,
    style: {
      ...__ds_scope.controlStyle({
        focus: st.focus,
        invalid: !!st.shownError,
        valid: st.shownValid,
        extra: {
          resize: 'vertical',
          backgroundPosition: 'top 11px right 11px'
        }
      }),
      minHeight: 'auto'
    }
  }), counter ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-help-size)',
      lineHeight: 'var(--text-help-line)',
      color: 'var(--ns-secondary)',
      marginTop: '4px'
    }
  }, counter) : null);
}
Object.assign(__ds_scope, { TextareaField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fields/TextareaField.jsx", error: String((e && e.message) || e) }); }

// components/shell/Badge.jsx
try { (() => {
/** Type badge (secondary fill: "Twilio", "SMTP") or status badge (success fill: "Default for email"). */
function Badge({
  kind = 'type',
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      fontSize: 'var(--text-badge-size)',
      fontWeight: 'var(--text-badge-weight)',
      lineHeight: 1,
      padding: '3px 7px',
      borderRadius: 'var(--radius-badge)',
      color: '#fff',
      background: kind === 'status' ? 'var(--ns-success)' : 'var(--ns-badge)',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap'
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/Badge.jsx", error: String((e && e.message) || e) }); }

// components/shell/Banner.jsx
try { (() => {
/** Plugin page banner: 4:1 artwork, full container width, 6px radius, 16px above and below. */
function Banner({
  src,
  alt
}) {
  return /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      display: 'block',
      width: '100%',
      height: 'auto',
      aspectRatio: 'var(--banner-ratio)',
      objectFit: 'cover',
      borderRadius: 'var(--radius-card)',
      marginTop: '16px',
      marginBottom: '16px'
    }
  });
}
Object.assign(__ds_scope, { Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/Banner.jsx", error: String((e && e.message) || e) }); }

// components/shell/Card.jsx
try { (() => {
const {
  useState
} = React;
const strip = {
  background: 'var(--ns-subtle)',
  padding: 'var(--card-strip-padding)'
};

/**
 * Shell card: header strip (title, type badge, status badges | header links, Show help toggle), body (16px 16px 0),
 * optional result bar, footer strip (left: Remove/Duplicate; right: one outlined primary action).
 * The header title is the Name as typed; while Name is empty the source shows the card's id, and only without an id
 * "New {noun}" (`providerTitle` / `groupTitle`: `name || id || 'New provider'`; switches skip the id). Pass `id` and
 * `noun` to get that fallback. Known shell backlog item: a card whose Name is cleared shows its id in the header.
 */
function Card({
  title,
  id,
  noun = 'card',
  typeBadge,
  statusBadges = [],
  headerActions,
  children,
  result,
  onDismissResult,
  footerLeft,
  footerRight,
  helpDefault = true,
  onHelpToggle,
  style
}) {
  const [help, setHelp] = useState(helpDefault);
  const toggle = () => {
    setHelp(!help);
    onHelpToggle && onHelpToggle(!help);
  };
  const shown = (typeof title === 'string' ? title.trim() : title) || id && String(id).trim() || `New ${noun}`;
  return /*#__PURE__*/React.createElement("div", {
    className: help ? '' : 'ns-help-hidden',
    style: {
      border: '1px solid var(--ns-cardborder)',
      borderRadius: 'var(--radius-card)',
      marginBottom: 'var(--card-gap)',
      overflow: 'hidden',
      background: 'var(--ns-bg)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...strip,
      borderBottom: '1px solid var(--ns-cardborder)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: '8px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto',
      minWidth: 0,
      display: 'inline-flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '4px 8px'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 700
    }
  }, shown), typeBadge ? /*#__PURE__*/React.createElement(__ds_scope.Badge, null, typeBadge) : null, statusBadges.map(b => /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    key: b,
    kind: "status"
  }, b))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 auto',
      display: 'inline-flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      justifyContent: 'flex-end',
      gap: '4px 12px',
      fontSize: 'var(--text-help-size)'
    }
  }, headerActions, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondaryLink",
    onClick: toggle,
    "aria-pressed": help,
    style: {
      whiteSpace: 'nowrap'
    }
  }, help ? 'Hide help' : 'Show help'))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--card-padding) var(--card-padding) 0'
    }
  }, children), result ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderTop: '1px solid var(--ns-border)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px 16px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '1 1 auto'
    }
  }, result), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "link",
    onClick: onDismissResult
  }, "Dismiss")) : null, footerLeft || footerRight ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...strip,
      borderTop: '1px solid var(--ns-cardborder)',
      display: 'flex',
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px'
    }
  }, footerRight), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px 16px',
      marginRight: 'auto'
    }
  }, footerLeft)) : null);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/Card.jsx", error: String((e && e.message) || e) }); }

// components/shell/ChooserTiles.jsx
try { (() => {
const {
  useState
} = React;
/** Chooser tiles (auto-fit, min 150px): title + one help sentence; hover/focus outlines in link colour. `narrow` stacks them. Content is laid out from the top, so titles align across a row whether they take one line or two. */
function ChooserTiles({
  tiles = [],
  onPick,
  narrow
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: narrow ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(var(--tile-min-width), 1fr))',
      gap: 'var(--tile-gap)',
      width: '100%'
    }
  }, tiles.map(t => /*#__PURE__*/React.createElement(Tile, {
    key: t.id || t.title,
    tile: t,
    onPick: onPick
  })));
}
function Tile({
  tile,
  onPick
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onPick && onPick(tile),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      textAlign: 'left',
      padding: '12px',
      border: `1px solid ${hover ? 'var(--ns-link)' : 'var(--ns-border)'}`,
      boxShadow: hover ? '0 0 0 1px var(--ns-link)' : 'none',
      borderRadius: 'var(--radius-control)',
      background: 'transparent',
      color: 'inherit',
      cursor: 'pointer',
      minWidth: 0,
      font: 'inherit',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, tile.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-secondary)',
      lineHeight: 'var(--text-help-line)',
      marginTop: '4px'
    }
  }, tile.help));
}
Object.assign(__ds_scope, { ChooserTiles });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/ChooserTiles.jsx", error: String((e && e.message) || e) }); }

// components/shell/CreditFooter.jsx
try { (() => {
/** Version and credit footer: 20px mark (currentColor) · "{name} v{version}" · "Made by {author}" · site · Report an issue. 12.6px secondary, 1px top rule. */
const Mark = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 192 192",
  width: "20",
  height: "20",
  "aria-hidden": "true",
  focusable: "false",
  style: {
    width: 'var(--mark-size)',
    height: 'var(--mark-size)',
    flex: '0 0 auto'
  }
}, /*#__PURE__*/React.createElement("g", {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "12"
}, /*#__PURE__*/React.createElement("rect", {
  x: "18",
  y: "40",
  width: "76",
  height: "112"
})), /*#__PURE__*/React.createElement("rect", {
  x: "38",
  y: "60",
  width: "36",
  height: "36",
  fill: "currentColor"
}), /*#__PURE__*/React.createElement("g", {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "13",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M122.7 68.9A44 44 0 0 1 122.7 123.1"
}), /*#__PURE__*/React.createElement("path", {
  d: "M136.9 58.2A62 62 0 0 1 136.9 133.8"
}), /*#__PURE__*/React.createElement("path", {
  d: "M151 46.7A80 80 0 0 1 151 145.3"
})));

/** `mark`: pass true for the inlined Notify Switch mark (currentColor), or your own ReactNode. */
function CreditFooter({
  mark = true,
  markSrc,
  name = 'Notify Switch',
  version,
  author = 'Alex Rodriguez',
  site = 'alex-rodriguez.com',
  siteUrl = 'https://alex-rodriguez.com',
  issuesUrl = '#'
}) {
  const a = {
    color: 'var(--ns-link)',
    textDecoration: 'none'
  };
  const item = {
    whiteSpace: 'nowrap'
  };
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      marginTop: '24px',
      paddingTop: '12px',
      borderTop: '1px solid var(--ns-border)',
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-secondary)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...item,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35em',
      verticalAlign: 'bottom'
    }
  }, mark === true || markSrc ? /*#__PURE__*/React.createElement(Mark, null) : mark || null, /*#__PURE__*/React.createElement("span", null, name, version ? ` v${version}` : '')), ' · ', /*#__PURE__*/React.createElement("span", {
    style: item
  }, "Made by ", author), ' · ', /*#__PURE__*/React.createElement("span", {
    style: item
  }, /*#__PURE__*/React.createElement("a", {
    href: siteUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    style: a
  }, site)), ' · ', /*#__PURE__*/React.createElement("span", {
    style: item
  }, /*#__PURE__*/React.createElement("a", {
    href: issuesUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    style: a
  }, "Report an issue")));
}
Object.assign(__ds_scope, { CreditFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/CreditFooter.jsx", error: String((e && e.message) || e) }); }

// components/shell/Disclosure.jsx
try { (() => {
const {
  useEffect,
  useRef,
  useState
} = React;
/**
 * Disclosure line "▸ Advanced" / "▾ Advanced" in 12.6px secondary text (C3), a real <details> as in the source. Opens
 * a second grid. Collapsed by default; `defaultOpen` when something inside is set. Opens itself when a field inside it
 * reports a validation message (the `ns-invalid` event every Field dispatches), and when `focusField` targets a field
 * inside it, so an issue under Advanced is never invisible.
 */
function Disclosure({
  summary = 'Advanced',
  defaultOpen = false,
  open: controlled,
  onToggle,
  children,
  style
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);
  const isOpen = controlled !== undefined ? controlled : open;
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const reveal = () => {
      setOpen(true);
      onToggle && onToggle(true);
    };
    node.addEventListener('ns-invalid', reveal);
    return () => node.removeEventListener('ns-invalid', reveal);
  }, [onToggle]);
  return /*#__PURE__*/React.createElement("details", {
    ref: ref,
    className: "ns-advanced",
    open: isOpen,
    onToggle: e => {
      setOpen(e.currentTarget.open);
      onToggle && onToggle(e.currentTarget.open);
    },
    style: {
      marginBottom: '16px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      listStyle: 'none',
      cursor: 'pointer',
      display: 'inline-block',
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-secondary)',
      lineHeight: 'var(--text-help-line)'
    }
  }, isOpen ? '\u25BE\u00A0' : '\u25B8\u00A0', summary), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '8px'
    }
  }, children));
}
Object.assign(__ds_scope, { Disclosure });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/Disclosure.jsx", error: String((e && e.message) || e) }); }

// components/shell/DraftBar.jsx
try { (() => {
/** Unsaved-changes bar (host machinery): message + RESTORE (primary 31px) + DISCARD. Never shown on a fresh install. */
function DraftBar({
  message = 'You have unsaved changes from earlier. Restore them?',
  onRestore,
  onDiscard
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px',
      marginTop: '12px',
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement("span", null, message), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "add",
    onClick: onRestore,
    style: {
      minHeight: 'var(--button-sm-height)',
      padding: '4px 8px',
      fontSize: 'var(--text-btn-sm-size)',
      lineHeight: 'var(--text-btn-sm-line)'
    }
  }, "Restore"), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "outline",
    onClick: onDiscard
  }, "Discard"));
}
Object.assign(__ds_scope, { DraftBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/DraftBar.jsx", error: String((e && e.message) || e) }); }

// components/shell/Grid.jsx
try { (() => {
/** 12-column body grid, 8px column gap; each cell spans `span` columns and goes full width below 600px (via `narrow`). */
function Grid({
  children,
  style,
  rowGap = 0
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
      columnGap: 'var(--grid-gap)',
      rowGap,
      width: '100%',
      ...style
    }
  }, children);
}
function GridCell({
  span = 12,
  narrow,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: narrow ? '1 / -1' : `span ${span}`,
      minWidth: 0,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Grid, GridCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/Grid.jsx", error: String((e && e.message) || e) }); }

// components/shell/IssuesSummary.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Moves focus to a field's control (T5): opens every collapsed <details> above it first, then focuses the input,
 * select, textarea or checkbox itself. Nothing is rebuilt and nothing scrolls the page; moving focus is what brings
 * the field into view (the host owns all scrolling). `target` is the control's id or the element itself.
 */
function focusField(target) {
  const node = typeof target === 'string' ? document.getElementById(target) : target;
  if (!node) return false;
  for (let d = node.closest('details'); d; d = d.parentElement ? d.parentElement.closest('details') : null) d.open = true;
  const control = node.matches('input, select, textarea') ? node : node.querySelector('input, select, textarea');
  if (control) control.focus();
  return !!control;
}

/** Capitalised alias so the helper is reachable from the design-system namespace. */
const FocusField = focusField;

/**
 * "Fix these before saving:" summary (F4), in the page flow after Settings and above the closing paragraph, no shadow,
 * warning tone with the shell's #ffecb5 border. One entry per problem, "{Card name}: {message}", each a text button
 * that focuses the field (`fieldId`, or a custom `onClick`). Past three entries it collapses to "N fields need
 * attention" with Show all / Hide. SAVE is disabled while it shows.
 */
function IssuesSummary({
  issues = [],
  collapseAfter = 3,
  style
}) {
  const [expanded, setExpanded] = useState(false);
  if (!issues.length) return null;
  const collapsible = issues.length > collapseAfter;
  const collapsed = collapsible && !expanded;
  const n = issues.length;
  return /*#__PURE__*/React.createElement("div", {
    role: "alert",
    style: {
      background: 'var(--ns-warnbg)',
      border: '1px solid var(--ns-warnborder)',
      color: 'var(--ns-warntext)',
      borderRadius: 'var(--radius-control)',
      padding: '8px 12px',
      marginTop: '16px',
      lineHeight: 1.5,
      textAlign: 'start',
      position: 'static',
      boxShadow: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: '8px',
      marginBottom: '4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, collapsed ? `${n} field${n === 1 ? '' : 's'} need${n === 1 ? 's' : ''} attention` : 'Fix these before saving:'), collapsible ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "link",
    "aria-expanded": !collapsed,
    onClick: () => setExpanded(!expanded),
    style: {
      color: 'inherit'
    }
  }, collapsed ? 'Show all' : 'Hide') : null), collapsed ? null : /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: '20px',
      textAlign: 'left',
      listStylePosition: 'outside'
    }
  }, issues.map((i, k) => /*#__PURE__*/React.createElement("li", {
    key: i.fieldId || k,
    style: {
      marginBottom: '2px',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "data-issue-path": i.fieldId,
    onClick: () => {
      i.onClick ? i.onClick() : focusField(i.fieldId);
    },
    style: {
      background: 'none',
      border: 0,
      padding: 0,
      font: 'inherit',
      color: 'inherit',
      cursor: 'pointer',
      textAlign: 'left',
      whiteSpace: 'normal',
      verticalAlign: 'top',
      textDecoration: 'none'
    },
    onMouseEnter: e => e.currentTarget.style.textDecoration = 'underline',
    onMouseLeave: e => e.currentTarget.style.textDecoration = 'none'
  }, i.card ? /*#__PURE__*/React.createElement("strong", null, i.card, ": ") : null, i.message)))));
}
Object.assign(__ds_scope, { focusField, FocusField, IssuesSummary });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/IssuesSummary.jsx", error: String((e && e.message) || e) }); }

// components/shell/Modal.jsx
try { (() => {
const {
  useEffect,
  useRef
} = React;
const {
  createPortal
} = ReactDOM;
/**
 * Modal drawn by the page (`.ns-modal`): QR enlarge and the Reset confirmation, the only dialogs the shell allows (C5).
 * Fixed backdrop rgba(0,0,0,.55); dialog max-width 28rem (36rem `wide`), 8px radius, header with the title and a Close
 * button, body, actions row. Closed by Close, the backdrop, or Escape. Focus goes to the first `autoFocus` control,
 * else the first control in the body, when it opens.
 */
function Modal({
  title,
  open = true,
  wide,
  onClose,
  children,
  actions
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const raf = requestAnimationFrame(() => {
      const first = ref.current && (ref.current.querySelector('[autofocus], [data-autofocus]') || ref.current.querySelector('input, select, textarea') || ref.current.querySelector('button:not([aria-label="Close"])'));
      if (first) first.focus();
    });
    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
    };
  }, [open, onClose]);
  if (!open) return null;
  const rule = '1px solid var(--ns-border)';
  const node = /*#__PURE__*/React.createElement("div", {
    role: "presentation",
    onMouseDown: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      background: 'var(--ns-backdrop)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    style: {
      background: 'var(--ns-bg)',
      color: 'var(--ns-text)',
      borderRadius: 'var(--radius-modal)',
      width: '100%',
      maxWidth: wide ? '36rem' : 'var(--modal-max-width)',
      maxHeight: 'calc(100vh - 32px)',
      overflow: 'auto',
      boxShadow: 'var(--shadow-modal)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-size)',
      fontWeight: 'var(--text-body-weight)',
      lineHeight: 'var(--text-body-line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: rule
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Close",
    onClick: onClose,
    style: {
      background: 'none',
      border: 0,
      padding: '0 4px',
      font: 'inherit',
      fontSize: '20px',
      lineHeight: 1,
      color: 'var(--ns-secondary)',
      cursor: 'pointer'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px'
    }
  }, children), actions ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: '8px',
      padding: '12px 16px',
      borderTop: rule
    }
  }, actions) : null));
  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/Modal.jsx", error: String((e && e.message) || e) }); }

// components/shell/QrBlock.jsx
try { (() => {
const {
  useState
} = React;
/**
 * QR code with its caption (Telegram onboarding), and the phone alternative (T4): below 600px or on a coarse pointer
 * a phone cannot scan its own screen, so the QR block gives way to "Open in Telegram", "Copy link" and "Share"
 * (Share hidden when the browser has no Web Share API). The code itself is generated at runtime in the plugin
 * (qrcode-generator); pass the rendered SVG/element as `code`, or the placeholder is drawn.
 */
function QrBlock({
  url,
  code,
  caption = 'Scan to open BotFather',
  shareText,
  openLabel = 'Open in Telegram',
  narrow,
  size = '8rem'
}) {
  const isNarrow = __ds_scope.useNarrow(narrow);
  const [coarse] = useState(() => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false);
  const [copied, setCopied] = useState(null);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const copy = () => {
    const done = ok => {
      setCopied(ok ? 'Copied' : 'Could not copy');
      setTimeout(() => setCopied(null), 1500);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(() => done(true), () => done(false));else done(false);
  };
  if (isNarrow || coarse) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "footer",
      href: url
    }, openLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "outline",
      onClick: copy
    }, copied || 'Copy link'), canShare ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "outline",
      onClick: () => navigator.share({
        text: shareText,
        url
      }).catch(() => undefined)
    }, "Share") : null);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      width: size,
      maxWidth: '100%',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "img",
    "aria-label": caption,
    style: {
      width: '100%',
      aspectRatio: '1 / 1',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'var(--ns-qr-ground)',
      display: 'grid',
      placeItems: 'center'
    }
  }, code || /*#__PURE__*/React.createElement("div", {
    style: {
      width: '82%',
      height: '82%',
      backgroundImage: 'repeating-linear-gradient(90deg, #212529 0 8px, transparent 8px 16px), repeating-linear-gradient(0deg, #212529 0 8px, transparent 8px 16px)',
      backgroundBlendMode: 'multiply',
      opacity: 0.85
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '4px',
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-secondary)',
      lineHeight: 'var(--text-help-line)'
    }
  }, caption));
}
Object.assign(__ds_scope, { QrBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/QrBlock.jsx", error: String((e && e.message) || e) }); }

// components/shell/ResetDialog.jsx
try { (() => {
const {
  useState
} = React;
const LINES = ['All providers, groups, switches, and settings are removed.', 'Switches disappear from the Home app after the next restart.', 'Credentials files on disk are not touched.'];

/**
 * Reset to fresh install (M3): the red text button "Reset plugin to fresh install" in Settings > Advanced opens a
 * dialog with the three consequences, "Download backup first", the "Type RESET to confirm." field and a red Confirm
 * that stays disabled until RESET is typed. The field takes focus when the dialog opens.
 */
function ResetDialog({
  label = 'Reset plugin to fresh install',
  title = 'Reset plugin to fresh install?',
  lines = LINES,
  onDownloadBackup,
  onConfirm,
  disabled
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const close = () => {
    setOpen(false);
    setTyped('');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "dangerLink",
    disabled: disabled,
    onClick: () => setOpen(true)
  }, label), /*#__PURE__*/React.createElement(__ds_scope.Modal, {
    open: open,
    title: title,
    onClose: close,
    actions: /*#__PURE__*/React.createElement(__ds_scope.Button, {
      variant: "danger",
      disabled: typed.trim() !== 'RESET',
      onClick: () => {
        close();
        onConfirm && onConfirm();
      }
    }, "Confirm")
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '0 0 16px',
      paddingLeft: '16px'
    }
  }, lines.map(l => /*#__PURE__*/React.createElement("li", {
    key: l
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '16px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "outline",
    onClick: onDownloadBackup
  }, "Download backup first")), /*#__PURE__*/React.createElement(__ds_scope.TextField, {
    id: "ns-reset-confirm",
    label: "Type RESET to confirm.",
    value: typed,
    onChange: setTyped,
    mono: true,
    validate: false,
    style: {
      marginBottom: 0
    }
  })));
}
Object.assign(__ds_scope, { ResetDialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/ResetDialog.jsx", error: String((e && e.message) || e) }); }

// components/shell/SectionHeading.jsx
try { (() => {
/** Section heading: h2 20px weight 300 with a 1px bottom rule, 24px above the section, plus the section's one intro sentence. */
function SectionHeading({
  title,
  intro,
  first
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: first ? 0 : 'var(--section-gap)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 8px',
      padding: '0 0 4px',
      fontSize: 'var(--text-h2-size)',
      fontWeight: 'var(--text-h2-weight)',
      lineHeight: 1.2,
      borderBottom: '1px solid var(--ns-border)'
    }
  }, title), intro ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      lineHeight: 1.5
    }
  }, intro) : null);
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/shell/StatusBox.jsx
try { (() => {
const tones = {
  warning: ['var(--ns-warnbg)', 'var(--ns-warnborder)', 'var(--ns-warntext)'],
  success: ['var(--ns-successbg)', 'var(--ns-successborder)', 'var(--ns-successtext)'],
  danger: ['var(--ns-dangerbg)', 'var(--ns-dangerborder)', 'var(--ns-dangertext)'],
  info: ['var(--ns-infobg)', 'var(--ns-infoborder)', 'var(--ns-infotext)']
};

/** Status box (Bootstrap alert): "Saved. Restart Homebridge to apply.", test results, the default-provider prompt. Renders in the page flow; the host iframe has no viewport, so nothing is sticky. */
function StatusBox({
  tone = 'success',
  children,
  style
}) {
  const [bg, border, color] = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      background: bg,
      border: `1px solid ${border}`,
      color,
      borderRadius: 'var(--radius-control)',
      padding: '8px 12px',
      textAlign: 'start',
      lineHeight: 1.5,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { StatusBox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/shell/StatusBox.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notify-switch/App.jsx
try { (() => {
const NS3 = window.HomebridgePluginShell_fcc948;
const {
  Banner: Bn,
  SectionHeading: SH,
  DraftBar: DB,
  IssuesSummary: IS,
  StatusBox: SBox,
  CreditFooter: CFoot,
  Button: B3
} = NS3;
const SEED = {
  providers: [{
    id: 'twilio',
    type: 'twilio',
    name: 'Twilio'
  }, {
    id: 'fastmail',
    type: 'smtp',
    name: 'Fastmail'
  }, {
    id: 'ntfy',
    type: 'ntfy',
    name: 'ntfy'
  }],
  groups: [{
    id: 'family',
    name: 'Family - Garage',
    sms: [{
      value: '(555) 010-2345',
      storedAs: '+15550102345'
    }, {
      value: '(555) 010-3456',
      storedAs: '+15550103456'
    }],
    email: [{
      value: 'sam@example.com'
    }, {
      value: 'alex@example.com'
    }],
    ntfy: [{
      value: 'home-alerts'
    }]
  }],
  switches: [{
    id: '5f1c2a9e-4b3d-4f6a-9c1e-2d7b8e3f4a5b',
    name: 'Door Open Notification',
    message: 'Did you forget something? As of {{time}} the garage door has remained open for more than 15 minutes.',
    subject: 'Did you forget something?'
  }]
};
function ModalShell({
  width,
  dark,
  children,
  onSave,
  saveDisabled
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: dark ? '#0f0f0f' : '#e9ecef',
      padding: '24px 12px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      maxWidth: '100%',
      background: 'var(--ns-bg)',
      color: 'var(--ns-text)',
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,.3)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-size)',
      fontWeight: 300,
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--ns-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 400
    }
  }, "Notify Switch"), /*#__PURE__*/React.createElement("span", {
    "aria-label": "Close",
    style: {
      fontSize: 20,
      color: 'var(--ns-secondary)',
      cursor: 'pointer'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", null, children), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderTop: '1px solid var(--ns-border)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(B3, {
    variant: "outline",
    style: {
      minHeight: 38,
      fontSize: 16,
      padding: '6px 12px'
    }
  }, "Close"), /*#__PURE__*/React.createElement(B3, {
    variant: "add",
    disabled: saveDisabled,
    onClick: onSave
  }, "Save"))));
}
function App() {
  const [width, setWidth] = React.useState(800);
  const [dark, setDark] = React.useState(false);
  const [state, setState] = React.useState(SEED);
  const [draft, setDraft] = React.useState(false); // written only after a change (draft.ts); never on load
  const [saved, setSaved] = React.useState(null);
  const [master, setMaster] = React.useState('Notifications Enabled');
  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', dark);
    return () => document.body.classList.remove('dark-mode');
  }, [dark]);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setDraft(true);
  }, [state, master]);
  const narrow = width < 600;
  const set = k => v => setState(s => ({
    ...s,
    [k]: v
  }));
  const [restorable, setRestorable] = React.useState(true); // a stored draft from an earlier visit
  const [defaults, setDefaults] = React.useState({
    email: 'fastmail'
  });
  const gated = state.providers.length === 0;
  const fresh = gated && state.groups.length === 0 && state.switches.length === 0;
  const issues = [];
  for (const p of state.providers) if (!p.name) issues.push({
    card: p.id || 'New provider',
    message: 'Name is required.',
    fieldId: p.id + '-name'
  });
  for (const g of state.groups) if (!g.name) issues.push({
    card: g.id || 'New group',
    message: 'Name is required.',
    fieldId: g.id + '-name'
  });
  for (const s of state.switches) if (!s.name) issues.push({
    card: 'New switch',
    message: 'Name is required.',
    fieldId: s.id + '-name'
  });
  if (!master.trim()) issues.push({
    card: 'Settings',
    message: 'Master switch name is required.',
    fieldId: 'settings-masterName'
  });
  const addGated = (label, onClick) => gated ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(B3, {
    variant: "add",
    disabled: true,
    title: "Add a provider first."
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-secondary)'
    }
  }, "Add a provider first.")) : /*#__PURE__*/React.createElement(B3, {
    variant: "add",
    onClick: onClick
  }, label);
  const tb = {
    fontSize: 12,
    padding: '4px 8px',
    border: '1px solid #adb5bd',
    background: '#fff',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 8,
      left: 8,
      zIndex: 10,
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: tb,
    onClick: () => setDark(!dark)
  }, dark ? 'Light theme' : 'Dark theme'), /*#__PURE__*/React.createElement("button", {
    style: tb,
    onClick: () => setWidth(width === 800 ? 768 : width === 768 ? 400 : 800)
  }, width === 800 ? 'iPad width' : width === 768 ? 'Phone width' : 'Modal width'), /*#__PURE__*/React.createElement("button", {
    style: tb,
    onClick: () => {
      setState(fresh ? SEED : {
        providers: [],
        groups: [],
        switches: []
      });
      setDraft(false);
      setRestorable(false);
      setSaved(null);
    }
  }, fresh ? 'Configured' : 'Fresh install')), /*#__PURE__*/React.createElement(ModalShell, {
    width: width,
    dark: dark,
    saveDisabled: issues.length > 0,
    onSave: () => {
      setSaved(saved === 'reset' ? 'reset' : 'saved');
      setDraft(false);
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 16px',
      overflowWrap: 'anywhere'
    }
  }, /*#__PURE__*/React.createElement(Bn, {
    src: "../../assets/notify-switch-banner.png",
    alt: "Notify Switch \u2014 Homebridge switches that send SMS, email, Telegram, or ntfy messages when turned on."
  }), restorable && !fresh ? /*#__PURE__*/React.createElement(DB, {
    onRestore: () => setRestorable(false),
    onDiscard: () => setRestorable(false)
  }) : null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 8px'
    }
  }, "Notify Switch adds switches to the Home app. Turn one on, usually from an automation, and it sends a message, then turns itself off."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Set up in three steps: add a Provider (the service that sends), create a Recipient Group (who receives), then create a Switch (what to send). You only need one provider. Save, restart Homebridge, and add the switch to a HomeKit automation."), /*#__PURE__*/React.createElement(SH, {
    title: "Providers",
    intro: "A provider is the service that delivers your messages. Add only the ones you will use."
  }), /*#__PURE__*/React.createElement(ProvidersSection, {
    providers: state.providers,
    setProviders: set('providers'),
    groups: state.groups,
    narrow: narrow,
    defaults: defaults,
    setDefaults: setDefaults
  }), /*#__PURE__*/React.createElement(SH, {
    title: "Recipient Groups",
    intro: "A group is a list of people. Switches send to groups, so you enter each person once."
  }), state.groups.map(g => /*#__PURE__*/React.createElement(GroupCard, {
    key: g.id,
    g: g,
    narrow: narrow,
    onName: v => set('groups')(state.groups.map(x => x.id === g.id ? {
      ...x,
      name: v
    } : x)),
    onRemove: () => set('groups')(state.groups.filter(x => x.id !== g.id)),
    onDuplicate: () => set('groups')([...state.groups, {
      ...g,
      id: g.id + '-copy',
      name: g.name + ' copy'
    }])
  })), addGated('Add group', () => set('groups')([...state.groups, {
    id: 'group' + Date.now(),
    name: '',
    sms: [],
    email: [],
    ntfy: []
  }])), /*#__PURE__*/React.createElement(SH, {
    title: "Switches",
    intro: "Each switch appears in the Home app. Turning it on sends your message to everyone in the groups you pick, on every channel they have, then the switch turns itself off."
  }), state.switches.map(s => /*#__PURE__*/React.createElement(SwitchCard, {
    key: s.id,
    s: s,
    groups: state.groups,
    providers: state.providers,
    narrow: narrow,
    onName: v => set('switches')(state.switches.map(x => x.id === s.id ? {
      ...x,
      name: v
    } : x)),
    onRemove: () => set('switches')(state.switches.filter(x => x.id !== s.id)),
    onDuplicate: () => set('switches')([...state.switches, {
      ...s,
      id: crypto.randomUUID(),
      name: s.name + ' copy'
    }])
  })), addGated('Add switch', () => set('switches')([...state.switches, {
    id: crypto.randomUUID(),
    name: '',
    message: '',
    subject: ''
  }])), /*#__PURE__*/React.createElement(SH, {
    title: "Settings",
    intro: "Platform-wide options. The default country is used when a phone number is entered without a country code."
  }), /*#__PURE__*/React.createElement(SettingsSection, {
    narrow: narrow,
    providers: state.providers,
    master: master,
    setMaster: setMaster,
    onReset: () => {
      setState({
        providers: [],
        groups: [],
        switches: []
      });
      setRestorable(false);
      setSaved('reset');
    }
  }), /*#__PURE__*/React.createElement(IS, {
    issues: issues
  }), saved === 'reset' ? /*#__PURE__*/React.createElement(SBox, {
    style: {
      marginTop: 16
    }
  }, "Configuration reset. Click Save, then restart Homebridge.") : saved ? /*#__PURE__*/React.createElement(SBox, {
    style: {
      marginTop: 16
    }
  }, "Saved. Restart Homebridge to apply.") : null, draft ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-secondary)'
    }
  }, "Draft kept in this browser (structure only, no secrets).") : null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '24px 0 0'
    }
  }, "After saving, restart Homebridge. Your switches appear in the Home app. Open Automations, choose a trigger such as a sensor detecting water, and add the switch with Turn On as the action. You can also test by tapping the switch directly."), /*#__PURE__*/React.createElement(CFoot, {
    markSrc: "../../assets/notify-switch-mark.svg",
    name: "Notify Switch",
    version: "1.3.2",
    issuesUrl: "https://github.com/arodbuilds/homebridge-notify-switch/issues",
    siteUrl: "https://alex-rodriguez.com/?ref=notify-switch#building"
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notify-switch/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notify-switch/GroupsSwitchesSettings.jsx
try { (() => {
const NS2 = window.HomebridgePluginShell_fcc948;
const {
  Card: Card2,
  Grid: G,
  GridCell: GC,
  Disclosure: Disc,
  TextField: TF,
  SelectField: SF,
  TextareaField: TA,
  CheckField: CF,
  ListField: LF,
  Block: Blk,
  Preview: Prev,
  Button: Btn,
  InlineConfirm: IC,
  HelpText: HT,
  StatusBox: SB,
  ResetDialog: RD
} = NS2;
function GroupCard({
  g,
  narrow,
  onName,
  onRemove,
  onDuplicate
}) {
  const cell = (span, c) => /*#__PURE__*/React.createElement(GC, {
    span: span,
    narrow: narrow
  }, c);
  return /*#__PURE__*/React.createElement(Card2, {
    title: g.name,
    id: g.id,
    noun: "group",
    footerLeft: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IC, {
      label: "Remove group",
      question: `Remove ${g.name || 'this group'}?`,
      onConfirm: onRemove
    }), /*#__PURE__*/React.createElement(Btn, {
      variant: "link",
      onClick: onDuplicate
    }, "Duplicate group"))
  }, /*#__PURE__*/React.createElement(G, null, cell(12, /*#__PURE__*/React.createElement(TF, {
    id: `${g.id}-name`,
    label: "Name",
    required: true,
    value: g.name,
    onChange: onName,
    help: "Who is in this list. For example: Family, Neighbors, On-call."
  })), cell(12, /*#__PURE__*/React.createElement(LF, {
    label: "Phone numbers (SMS)",
    addLabel: "Add phone number",
    placeholder: "e.g. (555) 010-2345",
    items: g.sms,
    help: "Stored with the country code from Settings."
  })), cell(12, /*#__PURE__*/React.createElement(LF, {
    label: "Email addresses",
    addLabel: "Add email address",
    placeholder: "e.g. sam@example.com",
    items: g.email
  })), cell(12, /*#__PURE__*/React.createElement(LF, {
    label: "Telegram chat IDs",
    addLabel: "Add chat ID",
    items: [],
    help: "Use Find people and groups on your Telegram provider. IDs are numbers, not usernames."
  })), cell(12, /*#__PURE__*/React.createElement(LF, {
    label: "ntfy topics",
    addLabel: "Add topic",
    items: g.ntfy,
    help: "Topic names as subscribed in the ntfy app. Letters, numbers, dashes and underscores."
  }))), /*#__PURE__*/React.createElement(Disc, null, /*#__PURE__*/React.createElement(G, null, cell(6, /*#__PURE__*/React.createElement(TF, {
    label: "ID",
    readonly: true,
    defaultValue: g.id,
    mono: true,
    help: "How switches refer to this group in config.json."
  })))));
}
function SwitchCard({
  s,
  groups,
  providers,
  narrow,
  onName,
  onRemove,
  onDuplicate
}) {
  const [result, setResult] = React.useState(null);
  const [vars, setVars] = React.useState(false);
  const cell = (span, c) => /*#__PURE__*/React.createElement(GC, {
    span: span,
    narrow: narrow
  }, c);
  const sms = groups.reduce((n, g) => n + g.sms.length, 0),
    email = groups.reduce((n, g) => n + g.email.length, 0),
    ntfy = groups.reduce((n, g) => n + g.ntfy.length, 0);
  const has = t => providers.some(p => p.type === t);
  const emailP = providers.find(p => p.type === 'smtp') || providers.find(p => p.type === 'twilio');
  const parts = [];
  if (has('twilio') && sms) parts.push(`SMS via ${providers.find(p => p.type === 'twilio').name} to ${sms} number${sms === 1 ? '' : 's'}`);
  if (emailP && email) parts.push(`email via ${emailP.name} to ${email} address${email === 1 ? '' : 'es'}`);
  if (has('ntfy') && ntfy) parts.push(`ntfy via ${providers.find(p => p.type === 'ntfy').name} to ${ntfy} topic${ntfy === 1 ? '' : 's'}`);
  const varsToggle = /*#__PURE__*/React.createElement(Btn, {
    variant: "link",
    onClick: () => setVars(!vars),
    style: {
      fontSize: 'var(--text-help-size)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: '.5em',
      height: '.5em',
      borderRight: '.12em solid currentColor',
      borderBottom: '.12em solid currentColor',
      transform: vars ? 'translateY(-.25em) rotate(45deg)' : 'translateY(-.15em) rotate(-45deg)',
      marginRight: '.35em'
    }
  }), vars ? 'Hide variables' : 'Show variables');
  return /*#__PURE__*/React.createElement(Card2, {
    title: s.name,
    noun: "switch",
    result: result,
    onDismissResult: () => setResult(null),
    footerLeft: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IC, {
      label: "Remove switch",
      question: `Remove ${s.name || 'this switch'}?`,
      onConfirm: onRemove
    }), /*#__PURE__*/React.createElement(Btn, {
      variant: "link",
      onClick: onDuplicate
    }, "Duplicate switch")),
    footerRight: /*#__PURE__*/React.createElement(IC, {
      label: "Test send",
      startVariant: "footer",
      confirmVariant: "footer",
      confirmLabel: "Send",
      question: `Send to ${sms + email + ntfy} recipients now?`,
      onConfirm: () => setResult('Sent. The switch turned on, then off again.')
    })
  }, /*#__PURE__*/React.createElement(G, null, cell(12, /*#__PURE__*/React.createElement(TF, {
    id: `${s.id}-name`,
    label: "Name",
    required: true,
    value: s.name,
    onChange: onName,
    placeholder: "e.g. Water Leak Alert",
    help: "Shown in the Home app. Letters, numbers, spaces, and apostrophes. For example: Water Leak Alert, Smoke Alarm."
  })), cell(12, /*#__PURE__*/React.createElement(CF, {
    label: "Enabled",
    defaultChecked: true
  })), cell(6, /*#__PURE__*/React.createElement(TF, {
    label: "Cooldown (seconds)",
    type: "number",
    defaultValue: "0",
    help: "Minimum seconds between sends for this switch. 0 disables the cooldown."
  })), cell(6, /*#__PURE__*/React.createElement(SF, {
    label: "Failure Mode",
    options: ['Any', 'All', 'Off'],
    defaultValue: "Any",
    help: "Any: the sensor trips if any recipient fails. All: only if every recipient fails. Off: never trips; failures are still logged."
  })), cell(12, /*#__PURE__*/React.createElement(CF, {
    label: "Failure Sensor",
    help: "Adds a sensor to this switch that HomeKit automations can watch. It opens when a message fails to send."
  })), cell(12, /*#__PURE__*/React.createElement(Blk, {
    label: "Recipients",
    help: "Everyone in the groups you tick gets the message on every channel they have an address for.",
    captionBelow: true
  }, groups.length ? groups.map(g => /*#__PURE__*/React.createElement(CF, {
    compact: true,
    key: g.id,
    label: `${g.name}: ${[g.sms.length && `${g.sms.length} SMS`, g.email.length && `${g.email.length} email`, g.ntfy.length && `${g.ntfy.length} ntfy`].filter(Boolean).join(', ') || 'no addresses yet'}`,
    defaultChecked: true
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ns-secondary)'
    }
  }, "No groups yet. Add one under Recipient Groups, or add extra recipients below."))), cell(12, /*#__PURE__*/React.createElement(Blk, {
    label: "Extra recipients",
    help: "People outside the groups above, entered under their channel.",
    captionBelow: true
  }, /*#__PURE__*/React.createElement(G, {
    rowGap: 8
  }, /*#__PURE__*/React.createElement(GC, {
    span: 6,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(LF, {
    label: "Phone numbers (SMS)",
    addLabel: "Add phone number",
    items: [],
    style: {
      marginBottom: 0
    }
  })), /*#__PURE__*/React.createElement(GC, {
    span: 6,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(LF, {
    label: "Email addresses",
    addLabel: "Add email address",
    items: [],
    style: {
      marginBottom: 0
    }
  })), has('ntfy') ? /*#__PURE__*/React.createElement(GC, {
    span: 6,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(LF, {
    label: "ntfy topics",
    addLabel: "Add topic",
    items: [],
    style: {
      marginBottom: 0
    }
  })) : null))), cell(12, /*#__PURE__*/React.createElement(Blk, {
    label: "Send by",
    help: "Untick a channel to skip it for this switch.",
    captionBelow: true
  }, /*#__PURE__*/React.createElement(G, {
    rowGap: 4
  }, has('twilio') ? /*#__PURE__*/React.createElement(GC, {
    span: 4,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(CF, {
    compact: true,
    label: `SMS (${sms} number${sms === 1 ? '' : 's'})`,
    defaultChecked: true
  })) : null, emailP ? /*#__PURE__*/React.createElement(GC, {
    span: 4,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(CF, {
    compact: true,
    label: `Email (${email} address${email === 1 ? '' : 'es'})`,
    defaultChecked: true
  })) : null, has('ntfy') ? /*#__PURE__*/React.createElement(GC, {
    span: 4,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(CF, {
    compact: true,
    label: `ntfy (${ntfy} topic${ntfy === 1 ? '' : 's'})`,
    defaultChecked: true
  })) : null))), cell(12, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TA, {
    id: `${s.id}-message`,
    label: "Message",
    required: true,
    defaultValue: s.message,
    labelExtra: varsToggle,
    counter: "97 characters, 97 of 160 used, 1 segment",
    help: "Up to 160 plain characters. Emoji and special symbols are not allowed for SMS.",
    helpLink: "More about variables",
    helpLinkHref: "https://github.com/arodbuilds/homebridge-notify-switch#template-variables",
    style: {
      marginBottom: vars ? 8 : 16
    }
  }), vars ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-help-size)',
      color: 'var(--ns-secondary)',
      lineHeight: 1.4,
      marginBottom: 16
    }
  }, "Type these anywhere in the message or subject:", /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '4px 0',
      paddingLeft: 16
    }
  }, [['{{switchName}}', s.name || 'Switch name'], ['{{time}}', '5:15 PM'], ['{{date}}', '9/13/2026'], ['{{datetime}}', '9/13/2026 5:15 PM']].map(([t, v]) => /*#__PURE__*/React.createElement("li", {
    key: t
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      color: 'var(--ns-link)',
      fontFamily: 'var(--font-mono)'
    }
  }, t), " ", v))), "Click a variable to insert it at the cursor.") : null)), cell(12, /*#__PURE__*/React.createElement(TF, {
    label: "Subject",
    defaultValue: s.subject,
    labelExtra: /*#__PURE__*/React.createElement(Btn, {
      variant: "link",
      style: {
        fontSize: 'var(--text-help-size)'
      }
    }, "Show variables"),
    help: "Used as the email subject and the ntfy title. Defaults to the switch name."
  })), cell(12, /*#__PURE__*/React.createElement(Prev, null, parts.length ? `Will send ${parts.join(', ')}.` : 'Nothing will be sent yet.'))), /*#__PURE__*/React.createElement(Disc, null, /*#__PURE__*/React.createElement(G, null, cell(12, /*#__PURE__*/React.createElement(TF, {
    label: "ID",
    readonly: true,
    defaultValue: s.id,
    mono: true,
    help: "Generated. HomeKit tracks the switch by this id, so you can rename it freely."
  })), cell(12, /*#__PURE__*/React.createElement(CF, {
    label: "Customize message per channel",
    help: "Write a different message for each channel. Each starts as a copy of the shared message."
  })), emailP ? cell(6, /*#__PURE__*/React.createElement(SF, {
    label: "Email provider",
    options: [`Platform default (${emailP.name})`, ...providers.filter(p => p.type === 'smtp' || p.type === 'twilio').map(p => `${p.name}${p.type === 'smtp' ? ' (SMTP)' : ''}`)],
    help: "For this switch only. The default for every switch is under Settings."
  })) : null, has('ntfy') ? cell(6, /*#__PURE__*/React.createElement(SF, {
    label: "Priority",
    options: ['Min', 'Low', 'Default', 'High', 'Urgent'],
    defaultValue: "Default",
    help: "How the app announces it. Urgent and high can break through Do Not Disturb; min shows no notification."
  })) : null, emailP ? cell(12, /*#__PURE__*/React.createElement(CF, {
    label: "Hide recipients from each other (BCC)",
    help: "Recipients go in Bcc and your from address in To, so nobody sees the other addresses. A message to one recipient always uses To."
  })) : null, has('ntfy') ? cell(6, /*#__PURE__*/React.createElement(TF, {
    label: "Tags",
    placeholder: "e.g. warning, house",
    help: "Optional. Up to 8, separated by commas. Emoji short codes such as warning or house show as icons in the app."
  })) : null)));
}
function SettingsSection({
  narrow,
  providers,
  onReset,
  master,
  setMaster
}) {
  const cell = (span, c) => /*#__PURE__*/React.createElement(GC, {
    span: span,
    narrow: narrow
  }, c);
  const emailPs = [...providers.filter(p => p.type === 'smtp'), ...providers.filter(p => p.type === 'twilio')];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(G, null, cell(6, /*#__PURE__*/React.createElement(TF, {
    id: "settings-name",
    label: "Name",
    required: true,
    defaultValue: "Notify Switch",
    help: "Platform display name shown in the Homebridge logs."
  })), cell(6, /*#__PURE__*/React.createElement(SF, {
    label: "Default Country",
    options: ['United States (+1)', 'Canada (+1)', 'United Kingdom (+44)', 'Australia (+61)', 'Germany (+49)'],
    help: "Phone numbers entered without a country code are treated as numbers from this country."
  })), cell(6, /*#__PURE__*/React.createElement(SF, {
    label: "Time format",
    options: ['12-hour (5:15 PM)', '24-hour (17:15)']
  })), cell(6, /*#__PURE__*/React.createElement(SF, {
    label: "Date format",
    options: ['Month/Day/Year (9/8/2026)', 'Day/Month/Year (8/9/2026)', 'Year-Month-Day (2026-09-08)'],
    help: "Used by {{time}}, {{date}} and {{datetime}} in messages."
  })), cell(6, /*#__PURE__*/React.createElement(CF, {
    label: "Show master switch",
    defaultChecked: true,
    help: "A single switch in the Home app that turns all notifications on or off. When it is off, no switch sends anything."
  })), cell(6, /*#__PURE__*/React.createElement(TF, {
    id: "settings-masterName",
    label: "Master switch name",
    required: true,
    value: master,
    onChange: setMaster,
    help: "Letters, numbers, spaces, and apostrophes only. Must start and end with a letter or number."
  })), emailPs.length ? cell(6, /*#__PURE__*/React.createElement(SF, {
    label: "Default email provider",
    options: emailPs.map(p => `${p.name}${p.type === 'smtp' ? ' (SMTP)' : ''}`),
    help: "Switches send email through this provider unless a switch says otherwise under Advanced."
  })) : null, cell(6, /*#__PURE__*/React.createElement(CF, {
    label: "Debug logging",
    help: "Verbose logging, including message bodies and full recipient addresses. Credentials are never logged, even with this on."
  }))), /*#__PURE__*/React.createElement(Disc, null, /*#__PURE__*/React.createElement(HT, {
    style: {
      marginTop: 0,
      marginBottom: 16
    }
  }, "The full backup contains your provider credentials; store it like a password. The version without credentials is safe to share when asking for help."), /*#__PURE__*/React.createElement(G, {
    rowGap: 8,
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(GC, {
    span: 6,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline"
  }, "Download backup")), /*#__PURE__*/React.createElement(GC, {
    span: 6,
    narrow: narrow
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "outline"
  }, "Download backup without credentials"))), /*#__PURE__*/React.createElement(G, null, cell(12, /*#__PURE__*/React.createElement(TF, {
    label: "Restore from backup",
    type: "file",
    help: "Choose a backup file. It is checked before anything changes; if it passes, the form is replaced with its contents and Save is enabled."
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(RD, {
    onConfirm: onReset
  }))));
}
Object.assign(window, {
  GroupCard,
  SwitchCard,
  SettingsSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notify-switch/GroupsSwitchesSettings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/notify-switch/Providers.jsx
try { (() => {
const NS = window.HomebridgePluginShell_fcc948;
const {
  Button,
  InlineConfirm,
  Card,
  Grid,
  GridCell,
  Disclosure,
  TextField,
  PasswordField,
  SelectField,
  SegmentedField,
  CheckField,
  ListField,
  Note,
  Step,
  HelpText,
  StatusBox,
  ChooserTiles,
  QrBlock
} = NS;
const PRESETS = {
  Fastmail: ['smtp.fastmail.com', '465', 'SSL'],
  Gmail: ['smtp.gmail.com', '465', 'SSL'],
  iCloud: ['smtp.mail.me.com', '587', 'STARTTLS'],
  'Outlook.com': ['smtp-mail.outlook.com', '587', 'STARTTLS'],
  Yahoo: ['smtp.mail.yahoo.com', '465', 'SSL'],
  Zoho: ['smtp.zoho.com', '465', 'SSL']
};
const RM = 'https://github.com/arodbuilds/homebridge-notify-switch#';
const W = 'Where do I find this?';
const NAME_HELP = 'How this provider is listed when you set up a switch. For example: Twilio, Home Gmail, Family bot.';
const CRED_HELP = "Optional. A JSON file, relative to the Homebridge storage directory, that holds this provider's secrets so they stay out of config.json.";
const TILES = [{
  id: 'twilio',
  title: 'Twilio',
  help: 'SMS text messages, and email if you have a Twilio-authenticated domain.'
}, {
  id: 'smtp',
  title: 'Email (SMTP)',
  help: 'Send from a mailbox you already have, such as Fastmail, Gmail, iCloud, or Outlook.'
}, {
  id: 'telegram',
  title: 'Telegram',
  help: 'Free messages through a bot you create. Best for family group chats.'
}, {
  id: 'ntfy',
  title: 'ntfy',
  help: 'Free push notifications to the ntfy app. No account needed for public topics.'
}];
const TYPE_LABEL = {
  twilio: 'Twilio',
  smtp: 'SMTP',
  telegram: 'Telegram',
  ntfy: 'ntfy'
};
function ProviderCard({
  p,
  narrow,
  onRemove,
  onName,
  groups,
  isDefault,
  canDefault,
  onMakeDefault
}) {
  const [result, setResult] = React.useState(null);
  const [preset, setPreset] = React.useState('Fastmail');
  const [locked, setLocked] = React.useState(true);
  const server = PRESETS[preset] || ['', '', 'SSL'];
  const test = () => setResult('Connected and signed in.');
  const cell = (span, child) => /*#__PURE__*/React.createElement(GridCell, {
    span: span,
    narrow: narrow
  }, child);
  const name = cell(12, /*#__PURE__*/React.createElement(TextField, {
    id: `${p.id}-name`,
    label: "Name",
    required: true,
    value: p.name,
    onChange: onName,
    help: NAME_HELP
  }));
  const cred = id => cell(p.type === 'twilio' ? 12 : 6, /*#__PURE__*/React.createElement(TextField, {
    label: "Credentials File",
    placeholder: `e.g. notify-switch-${id}.json`,
    help: CRED_HELP,
    helpLink: W,
    helpLinkHref: RM + 'keeping-secrets-out-of-configjson-with-credentialsfile'
  }));
  const idf = (v, span = 6) => cell(span, /*#__PURE__*/React.createElement(TextField, {
    id: `${p.id}-id`,
    label: "ID",
    readonly: true,
    defaultValue: v,
    mono: true,
    help: "How switches refer to this provider in config.json."
  }));
  let body, adv;
  if (p.type === 'twilio') {
    body = /*#__PURE__*/React.createElement(React.Fragment, null, name, cell(12, /*#__PURE__*/React.createElement(TextField, {
      id: `${p.id}-accountSid`,
      label: "Account SID",
      required: true,
      defaultValue: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      mono: true,
      valid: true,
      help: "Copy from the Twilio Console home page. It starts with AC and is not a secret.",
      helpLink: W,
      helpLinkHref: RM + 'twilio-sms-and-email'
    })), cell(12, /*#__PURE__*/React.createElement(TextField, {
      label: "API Key SID",
      required: true,
      defaultValue: "SK1234567890abcdef1234567890abcdef",
      mono: true,
      valid: true,
      placeholder: "e.g. SK\u2026",
      help: "Create a Standard key in the Twilio Console and paste its SID and secret. The secret is shown once.",
      helpLink: "Why not the Auth Token?",
      helpLinkHref: RM + 'api-keys'
    })), cell(12, /*#__PURE__*/React.createElement(PasswordField, {
      label: "API Key Secret",
      defaultValue: "secretsecretsecret"
    })), cell(12, /*#__PURE__*/React.createElement(ListField, {
      label: "SMS Senders",
      addLabel: "Add sender number",
      placeholder: "e.g. (555) 010-1234",
      items: [{
        value: '(555) 010-1234',
        storedAs: '+15550101234'
      }],
      help: "Numbers you own in Twilio. Use Look up numbers to pick from your account."
    })), cell(12, /*#__PURE__*/React.createElement(Note, {
      link: "How do I register?",
      linkHref: RM + 'a2p-10dlc-registration-for-us-numbers'
    }, "US numbers must be registered for A2P 10DLC or carriers will block messages.")), cell(12, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "outline"
    }, "Look up numbers"), /*#__PURE__*/React.createElement(HelpText, null, "Lists the phone numbers and Messaging Services on your Twilio account so you can pick instead of typing. Manual entry always works."))), cell(7, /*#__PURE__*/React.createElement(TextField, {
      label: "Email From address",
      placeholder: "e.g. alerts@example.com",
      help: "Send email from this address through Twilio. Its domain must be verified in the Twilio Console under Email > Domains.",
      helpLink: W,
      helpLinkHref: RM + 'email-through-twilio'
    })), cell(5, /*#__PURE__*/React.createElement(TextField, {
      label: "Email From name",
      placeholder: "e.g. Home"
    })));
    adv = /*#__PURE__*/React.createElement(React.Fragment, null, idf('twilio'), cell(6, /*#__PURE__*/React.createElement(TextField, {
      label: "Messaging Service SID",
      placeholder: "MG\u2026",
      mono: true,
      help: "Optional. Use a Messaging Service instead of a specific number. Found at Console > Messaging > Services. Starts with MG."
    })), cred('twilio'));
  } else if (p.type === 'ntfy') {
    body = /*#__PURE__*/React.createElement(React.Fragment, null, name, cell(12, /*#__PURE__*/React.createElement(Note, {
      link: W,
      linkHref: RM + 'ntfy'
    }, "ntfy delivers to the ntfy app on your phone. Install the app, subscribe to a topic name of your choosing, and add that topic to a group. Anyone who knows the topic name can read it, so pick something unguessable or use an access token.")), cell(12, /*#__PURE__*/React.createElement(TextField, {
      label: "Server",
      required: true,
      defaultValue: "https://ntfy.sh",
      valid: true,
      help: "Leave as ntfy.sh unless you run your own server."
    })), cell(12, /*#__PURE__*/React.createElement(SelectField, {
      label: "Authentication",
      options: [{
        value: 'none',
        label: 'None'
      }, {
        value: 'token',
        label: 'Access token (recommended)'
      }, {
        value: 'basic',
        label: 'Username and password'
      }],
      defaultValue: "none",
      help: "No credentials. Works for public topics on ntfy.sh; anyone who guesses the topic name can publish to it too.",
      helpLink: W,
      helpLinkHref: RM + 'ntfy'
    })));
    adv = /*#__PURE__*/React.createElement(React.Fragment, null, idf('ntfy'), cred('ntfy'));
  } else if (p.type === 'smtp') {
    body = /*#__PURE__*/React.createElement(React.Fragment, null, name, cell(12, /*#__PURE__*/React.createElement(SegmentedField, {
      label: "Mail provider",
      options: ['Fastmail', 'Gmail', 'iCloud', 'Outlook.com', 'Yahoo', 'Zoho', 'Other'],
      value: preset,
      narrow: narrow,
      onChange: v => {
        setPreset(v);
        setLocked(v !== 'Other');
      },
      help: "Pick your mail service to fill in the server settings. Choose Other for any other mail server."
    })), cell(7, /*#__PURE__*/React.createElement(TextField, {
      key: preset + locked,
      id: `${p.id}-host`,
      label: "Host",
      required: true,
      readonly: locked,
      labelExtra: locked ? /*#__PURE__*/React.createElement(Button, {
        variant: "link",
        style: {
          fontSize: 'var(--text-help-size)'
        },
        onClick: () => setLocked(false)
      }, "Edit") : null,
      defaultValue: server[0]
    })), cell(2, /*#__PURE__*/React.createElement(TextField, {
      key: preset + locked + 'p',
      id: `${p.id}-port`,
      label: "Port",
      readonly: locked,
      defaultValue: server[1]
    })), cell(3, /*#__PURE__*/React.createElement(SelectField, {
      key: preset + locked + 's',
      label: "Security",
      readonly: locked,
      options: ['SSL', 'STARTTLS', 'None'],
      defaultValue: server[2]
    })), cell(12, /*#__PURE__*/React.createElement(HelpText, {
      style: {
        marginTop: -8,
        marginBottom: 16
      }
    }, locked ? 'Filled in from the mail provider above. Click Edit to change them.' : "Your mail provider's outgoing server settings. For example: smtp.fastmail.com, 465, SSL.")), cell(12, /*#__PURE__*/React.createElement(TextField, {
      label: "Username",
      required: true,
      defaultValue: "you@example.com",
      valid: true,
      help: "Usually your full email address. For example: you@example.com."
    })), cell(12, /*#__PURE__*/React.createElement(PasswordField, {
      label: "Password",
      defaultValue: "app-password-here",
      help: "Use an app password, not your login password. Most providers require it.",
      helpLink: "Where do I create one?",
      helpLinkHref: RM + 'app-passwords'
    })), cell(7, /*#__PURE__*/React.createElement(TextField, {
      label: "From address",
      required: true,
      defaultValue: "alerts@example.com",
      valid: true,
      help: "The address messages come from. Your provider must allow sending from it. For example: alerts@example.com."
    })), cell(5, /*#__PURE__*/React.createElement(TextField, {
      label: "From name",
      defaultValue: "Home",
      help: "Optional. Some providers replace this with your account's display name."
    })));
    adv = /*#__PURE__*/React.createElement(React.Fragment, null, idf('fastmail'), cred('fastmail'));
  } else {
    body = /*#__PURE__*/React.createElement(React.Fragment, null, name, cell(12, /*#__PURE__*/React.createElement(Step, {
      number: 1,
      title: "Create your bot",
      help: "On your phone, scan this code with the camera to open BotFather in Telegram. On a computer with Telegram installed, click Open BotFather instead. Then, in the BotFather chat: send /newbot, choose a display name such as Home Alerts, choose a username ending in bot, and BotFather replies with a token."
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(QrBlock, {
      url: "https://t.me/BotFather",
      caption: "Scan to open BotFather",
      narrow: narrow
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      href: "https://t.me/BotFather"
    }, "Open BotFather")), /*#__PURE__*/React.createElement(PasswordField, {
      id: `${p.id}-botToken`,
      label: "Bot Token",
      defaultValue: "",
      help: "BotFather sends the token. It looks like 123456789:AAF\u2026 Treat it like a password.",
      helpLink: W,
      helpLinkHref: RM + 'telegram',
      style: {
        marginBottom: 0
      }
    }))), cell(12, /*#__PURE__*/React.createElement(Step, {
      number: 2,
      title: "Choose how people receive messages"
    }, /*#__PURE__*/React.createElement(SelectField, {
      label: "Delivery",
      options: ['Family group chat (recommended)', 'Individual chats'],
      help: "Everyone in the group gets every message. Nobody has to opt in individually.",
      style: {
        marginBottom: 0
      }
    }))), cell(12, /*#__PURE__*/React.createElement(Step, {
      number: 3,
      title: "Add the bot to your group",
      help: "Connect your bot in step 1 to get the links and QR codes."
    })), cell(12, /*#__PURE__*/React.createElement(Step, {
      number: 4,
      title: "Find people and groups",
      help: "Lists everyone who has opened the bot and every group it has been added to. Choose a recipient group, then add people to it."
    }, /*#__PURE__*/React.createElement(SelectField, {
      label: "Recipient group",
      options: groups.map(g => g.name),
      placeholder: "Choose a group\u2026",
      style: {
        marginBottom: 12
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "outline"
    }, "Find people and groups"))));
    adv = /*#__PURE__*/React.createElement(React.Fragment, null, idf('telegram'), cell(6, /*#__PURE__*/React.createElement(SelectField, {
      label: "Parse mode",
      options: ['Plain text', 'Markdown', 'HTML'],
      help: "How Telegram reads the message. Plain text is the safest choice."
    })));
  }
  const channel = p.type === 'ntfy' ? 'ntfy' : 'email';
  return /*#__PURE__*/React.createElement(Card, {
    title: p.name,
    id: p.id,
    noun: "provider",
    typeBadge: TYPE_LABEL[p.type],
    statusBadges: isDefault ? [`Default for ${channel}`] : [],
    headerActions: canDefault && !isDefault ? /*#__PURE__*/React.createElement(Button, {
      variant: "link",
      onClick: onMakeDefault
    }, "Make default for ", channel) : null,
    result: result,
    onDismissResult: () => setResult(null),
    footerLeft: /*#__PURE__*/React.createElement(InlineConfirm, {
      label: "Remove provider",
      question: `Remove ${p.name || 'this provider'}?`,
      onConfirm: onRemove
    }),
    footerRight: /*#__PURE__*/React.createElement(Button, {
      variant: "footer",
      onClick: test
    }, "Test connection")
  }, /*#__PURE__*/React.createElement(Grid, null, body), /*#__PURE__*/React.createElement(Disclosure, {
    defaultOpen: p.type === 'telegram' && false
  }, /*#__PURE__*/React.createElement(Grid, null, adv)));
}
function ProvidersSection({
  providers,
  setProviders,
  groups,
  narrow,
  defaults,
  setDefaults
}) {
  const [choosing, setChoosing] = React.useState(false);
  const add = t => {
    setProviders([...providers, {
      id: t.id + '-' + (providers.filter(x => x.type === t.id).length + 1),
      type: t.id,
      name: '',
      fresh: true
    }]);
    setChoosing(false);
  };
  const fresh = providers.length === 0;
  const chooser = fresh ? /*#__PURE__*/React.createElement("div", {
    role: "group",
    "aria-label": "Get started",
    style: {
      border: '1px solid var(--ns-cardborder)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--ns-subtle)',
      padding: '8px 16px',
      borderBottom: '1px solid var(--ns-cardborder)',
      fontWeight: 600
    }
  }, "Get started"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 0'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0
    }
  }, "Choose how you want to send messages. You can add more providers later."), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '12px 0 16px'
    }
  }, /*#__PURE__*/React.createElement(ChooserTiles, {
    tiles: TILES,
    onPick: add,
    narrow: narrow
  })))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, "Which service should send your messages?"), /*#__PURE__*/React.createElement(ChooserTiles, {
    tiles: TILES,
    onPick: add,
    narrow: narrow
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setChoosing(false)
  }, "Cancel")));
  const byChannel = ch => providers.filter(p => ch === 'email' ? p.type === 'smtp' || p.type === 'twilio' : p.type === 'ntfy');
  return /*#__PURE__*/React.createElement(React.Fragment, null, providers.map(p => {
    const ch = p.type === 'ntfy' ? 'ntfy' : 'email';
    const peers = byChannel(ch);
    const fallback = ch === 'email' ? peers.find(x => x.type === 'smtp') || peers[0] : peers[0];
    const isDefault = peers.length > 1 && (defaults[ch] || fallback.id) === p.id;
    return /*#__PURE__*/React.createElement(ProviderCard, {
      key: p.id,
      p: p,
      narrow: narrow,
      groups: groups,
      isDefault: isDefault,
      canDefault: peers.length > 1 && p.type !== 'telegram',
      onMakeDefault: () => setDefaults({
        ...defaults,
        [ch]: p.id
      }),
      onName: v => setProviders(providers.map(x => x.id === p.id ? {
        ...x,
        name: v
      } : x)),
      onRemove: () => setProviders(providers.filter(x => x.id !== p.id))
    });
  }), fresh || choosing ? chooser : /*#__PURE__*/React.createElement(Button, {
    variant: "add",
    onClick: () => setChoosing(true)
  }, "Add provider"));
}
Object.assign(window, {
  ProvidersSection,
  TILES
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/notify-switch/Providers.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.InlineConfirm = __ds_scope.InlineConfirm;

__ds_ns.Block = __ds_scope.Block;

__ds_ns.CheckField = __ds_scope.CheckField;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.HelpText = __ds_scope.HelpText;

__ds_ns.ListField = __ds_scope.ListField;

__ds_ns.Note = __ds_scope.Note;

__ds_ns.PasswordField = __ds_scope.PasswordField;

__ds_ns.Preview = __ds_scope.Preview;

__ds_ns.SegmentedField = __ds_scope.SegmentedField;

__ds_ns.SelectField = __ds_scope.SelectField;

__ds_ns.Step = __ds_scope.Step;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.TextareaField = __ds_scope.TextareaField;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.ChooserTiles = __ds_scope.ChooserTiles;

__ds_ns.CreditFooter = __ds_scope.CreditFooter;

__ds_ns.Disclosure = __ds_scope.Disclosure;

__ds_ns.DraftBar = __ds_scope.DraftBar;

__ds_ns.Grid = __ds_scope.Grid;

__ds_ns.GridCell = __ds_scope.GridCell;

__ds_ns.FocusField = __ds_scope.FocusField;

__ds_ns.IssuesSummary = __ds_scope.IssuesSummary;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.QrBlock = __ds_scope.QrBlock;

__ds_ns.ResetDialog = __ds_scope.ResetDialog;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.StatusBox = __ds_scope.StatusBox;

})();
