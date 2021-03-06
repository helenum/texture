import { Component } from 'substance'

const DISABLED = { disabled: true }

/**
 * @param {array} props.items
 * @param {object} props.commandStates
 */
export default class Menu extends Component {
  render ($$) {
    const { style, theme, items, commandStates } = this.props
    let el = $$('div').addClass('sc-menu')
    // TODO: try to consolidate. This is very similar to ToolGroup
    for (let item of items) {
      if (item.type === 'command') {
        const commandState = commandStates[item.name] || DISABLED
        const ToolClass = this._getToolClass(item)
        el.append(
          $$(ToolClass, {
            style,
            theme,
            item,
            commandState
          }).ref(item.name).addClass('se-item')
        )
      } else if (item.type === 'separator') {
        let separatorEl = $$('div').addClass('se-separator')
        if (item.label) {
          separatorEl.append(
            $$('div').addClass('se-label').append(
              this._getLabel(item.label)
            )
          )
        }
        el.append(separatorEl)
      } else {
        console.error('FIXME: Unsupported menu item type.', JSON.stringify(item))
      }
    }
    return el
  }

  _getToolClass (item) {
    // use an ToolClass from toolSpec if configured inline in ToolGroup spec
    let ToolClass = item.ToolClass
    // next try if there is a tool registered by the name
    if (!ToolClass) {
      ToolClass = this.context.toolRegistry.get(item.name)
    }
    // after all fall back to default classes
    if (!ToolClass) {
      if (this.props.style === 'descriptive') {
        ToolClass = this.getComponent('menu-item')
      } else {
        ToolClass = this.getComponent('toggle-tool')
      }
    }
    return ToolClass
  }

  _getLabel (label) {
    let labelProvider = this.context.labelProvider
    return labelProvider.getLabel(label)
  }
}
