import { Component, ModalPackage } from 'substance'
import EditEntity from '../../entities/EditEntity'
import entityRenderers from '../../entities/entityRenderers'

const { Modal } = ModalPackage

export default class Bibliography extends Component {
  didMount() {
    this.handleActions({
      'done': this._doneEditing
    })
  }

  getInitialState() {
    return {
      entityId: undefined
    }
  }

  render($$) {
    let el = $$('div').addClass('sc-bibliography')
    let editorSession = this.context.editorSession
    let entityDb = this.context.editorSession.getDocument()

    if (this.state.entityId) {
      var modal = $$(Modal, {
        width: 'medium',
        textAlign: 'center'
      })

      modal.append(
        $$(EditEntity, {
          editorSession: editorSession,
          node: entityDb.get(this.state.entityId)
        })
      )
      el.append(modal)
    }

    this.context.referenceManager.getBibliography().forEach((reference) => {
      let fragments = entityRenderers[reference.type]($$, reference.id, entityDb)
      el.append(
        $$('div').addClass('se-reference').append(
          $$('div').addClass('se-text').append(
            ...fragments
          ),
          $$('div').addClass('se-actions').append(
            $$('button').append('Edit').on('click', this._toggleEditor.bind(this, reference.id)),
            $$('button').append('Delete')
          )
        )
      )
    })
    return el
  }

  _toggleEditor(entityId) {
    this.setState({
      entityId
    })
  }

  _doneEditing() {
    this.setState({
      entityId: undefined
    })
  }
}
