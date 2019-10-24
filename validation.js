export default function valid (_,message) {
    return !/mso-hide/.test(message) &&
        !/Almost standards mode doctype./.test(message) &&
        !/The “align” attribute on the “td” element is obsolete. Use CSS instead./.test(message) &&
        !/The “valign” attribute on the “td” element is obsolete. Use CSS instead./.test(message) &&
        !/The “height” attribute on the “td” element is obsolete. Use CSS instead./.test(message) &&
        !/“mso-line-height-rule”: Property “mso-line-height-rule” doesn't exist./.test(message) &&
        !/The “align” attribute on the “table” element is obsolete. Use CSS instead./.test(message) &&
        !/The “center” element is obsolete. Use CSS instead./.test(message) &&
        !/Attribute “align” not allowed on element “small” at this point./.test(message) &&
        !/The element “h1” must not appear as a descendant of the “th” element./.test(message) &&
        !/The “align” attribute on the “h2” element is obsolete. Use CSS instead./.test(message) &&
        !/The element “h2” must not appear as a descendant of the “th” element./.test(message)
}