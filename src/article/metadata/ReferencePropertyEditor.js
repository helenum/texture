import { Component } from 'substance'
import MultiSelectInput from './MultiSelectInput'
import { getAvailableOptions } from './propertyEditorHelpers'

export default class ReferencePropertyEditor extends Component {
  render($$) {
    let property = this.props.property
    let name = property.name
    let data = this.props.model.toJSON()
    let value = data[name]
    // TODO: remove a div wrapper after ref persistence will be fixed in substance
    return $$(MultiSelectInput, {
      name: name,
      selectedOptions: value,
      warning: this.props.warning,
      availableOptions: getAvailableOptions(this.context.api, property.targetTypes)
    }).ref(name)
  }
}

/* Used for all multi-valued references */
ReferencePropertyEditor.matches = function(property) {
  return property.isReference() && property.isArray()
}