import { platform } from 'substance'
import { test } from 'substance-test'
import {
  setCursor, openManuscriptEditor, PseudoFileEvent, getEditorSession,
  fixture, loadBodyFixture, getDocument, openMenuAndFindTool, deleteSelection,
  clickUndo, isToolEnabled
} from './shared/integrationTestHelpers'
import { doesNotThrowInNodejs } from './shared/testHelpers'
import setupTestApp from './shared/setupTestApp'

// TODO: test download for a just uploaded file

const insertFileRefToolSelector = '.sm-insert-xref-file'
const insertSupplementaryFileToolSelector = '.sm-insert-file'
const downloadSupplementaryFileToolSelector = '.sc-download-supplementary-file-tool'
const replaceSupplementaryFileToolSelector = '.sc-replace-supplementary-file-tool'

const LOCAL_ASSET_NAME = 'example.zip'
const LOCAL_ASSET_URL = './tests/fixture/assets/' + LOCAL_ASSET_NAME
const REMOTE_ASSET_URL = 'http://substance.io/images/texture-1.0.png'

const PARAGRAPH_AND_LOCAL_SUPPLEMENTARY_FILE = `
  <p id="p1">ABC</p>
  <supplementary-material id="sm1" xlink:href="${LOCAL_ASSET_NAME}" xmlns:xlink="http://www.w3.org/1999/xlink">
    <label>Supplementary File 1</label>
    <caption id="sm1-caption">
      <p id="sm1-caption-p1">Description of Supplementary File</p>
    </caption>
  </supplementary-material>
`

const PARAGRAPH_AND_REMOTE_SUPPLEMENTARY_FILE = `
  <p id="p1">ABC</p>
  <supplementary-material id="sm1" xlink:href="${REMOTE_ASSET_URL}" xmlns:xlink="http://www.w3.org/1999/xlink">
    <label>Supplementary File 1</label>
    <caption id="sm1-caption">
      <p id="sm1-caption-p1">Description of Supplementary File</p>
    </caption>
  </supplementary-material>
`

test('Supplementary File: upload file and insert to a manuscript', t => {
  let { app } = setupTestApp(t, { archiveId: 'blank' })
  let editor = openManuscriptEditor(app)

  loadBodyFixture(editor, '<p id="p1">ABC</p>')
  t.notOk(_isToolEnabled(editor), 'tool shoud be disabled by default')
  setCursor(editor, 'p1.content', 2)
  t.ok(_isToolEnabled(editor), 'tool shoud be enabled')
  // Note: testing this only in nodejs because in Browser it is annoying as it opens the file dialog
  const workflow = _openWorkflow(editor)
  if (platform.inNodeJS) {
    t.doesNotThrow(() => {
      workflow.find('.sc-file-upload input').click()
    }, 'using tool should not throw')
  }
  doesNotThrowInNodejs(t, () => {
    workflow.find('.sc-file-upload')._selectFile(new PseudoFileEvent())
  }, 'triggering file upload should not throw')
  let afterP = editor.find('*[data-id=p1] + *')
  t.ok(afterP.hasClass('sm-supplementary-file'), 'element after p-1 should be a supplementary file now')
  t.end()
})

test('Supplementary File: insert remote file to a manuscript', t => {
  let { app } = setupTestApp(t, { archiveId: 'blank' })
  let editor = openManuscriptEditor(app)
  let doc = getDocument(editor)
  const link = 'http://substance.io/images/texture-1.0.png'

  loadBodyFixture(editor, '<p id="p1">ABC</p>')
  t.notOk(_isToolEnabled(editor), 'tool shoud be disabled by default')
  setCursor(editor, 'p1.content', 2)
  t.ok(_isToolEnabled(editor), 'tool shoud be enabled')
  // Note: testing this only in nodejs because in Browser it is annoying as it opens the file dialog
  const workflow = _openWorkflow(editor)
  const urlInput = workflow.find('.sc-input-with-button > .sc-input')
  urlInput.val(link)
  const urlAddButton = workflow.find('.sc-input-with-button > .sc-button')
  urlAddButton.click()
  let afterP = editor.find('*[data-id=p1] + *')
  t.ok(afterP.hasClass('sm-supplementary-file'), 'element after p-1 should be a supplementary file now')
  let fileId = afterP.getAttribute('data-id')
  let file = doc.get(fileId)
  t.equal(file.href, link, 'link should be ' + link)
  t.ok(file.remote, 'file should be remote')
  let urlEl = afterP.find('.se-href')
  t.equal(urlEl.textContent, link, 'there should be a link to an external file inside')
  t.end()
})

test('Supplementary File: remove from a manuscript', t => {
  let { app } = setupTestApp(t, { archiveId: 'blank' })
  let editor = openManuscriptEditor(app)
  let editorSession = getEditorSession(editor)
  let doc = getDocument(editor)

  const _isSupplementaryFileDisplayed = () => Boolean(editor.find('.sm-supplementary-file[data-id=sm1]'))
  const _supplemenaryFileExists = () => Boolean(doc.get('sm1'))

  loadBodyFixture(editor, PARAGRAPH_AND_LOCAL_SUPPLEMENTARY_FILE)

  t.ok(_isSupplementaryFileDisplayed(), 'supplementary file should be displayed in manuscript view')
  t.ok(_supplemenaryFileExists(), 'there should be sm1 node in document')
  editorSession.setSelection({
    type: 'node',
    nodeId: 'sm1',
    surfaceId: 'body',
    containerPath: ['body', 'content']
  })
  deleteSelection(editor)
  t.notOk(_isSupplementaryFileDisplayed(), 'supplementary file should not be displayed in manuscript view anymore')
  t.notOk(_supplemenaryFileExists(), 'supplementary file should have been removed from document')
  // undo a supplementary file removing
  doesNotThrowInNodejs(t, () => {
    clickUndo(editor)
  }, 'using "Undo" should not throw')
  t.ok(_isSupplementaryFileDisplayed(), 'supplementary file should be again in manuscript view')
  t.ok(_supplemenaryFileExists(), 'supplementary file should be again in document')
  t.end()
})

test('Supplementary File: reference a file', t => {
  let { app } = setupTestApp(t, { archiveId: 'blank' })
  let editor = openManuscriptEditor(app)
  let editorSession = getEditorSession(editor)
  const supplementaryFileSelector = '.sc-isolated-node.sm-supplementary-file'
  const xrefSelector = '.sc-inline-node .sm-file'
  const emptyLabel = '???'
  const getXref = () => editor.find(xrefSelector)

  loadBodyFixture(editor, PARAGRAPH_AND_LOCAL_SUPPLEMENTARY_FILE)
  t.equal(editor.findAll(supplementaryFileSelector).length, 1, 'there should be only one supplementary file in document')
  t.isNil(getXref(), 'there should be no references in manuscript')

  setCursor(editor, 'p1.content', 2)
  let insertFileRef = openMenuAndFindTool(editor, 'insert', insertFileRefToolSelector)
  doesNotThrowInNodejs(t, () => {
    insertFileRef.click()
  }, 'ref insertion should not throw')

  t.isNotNil(getXref(), 'there should be reference in manuscript')
  t.equal(getXref().text(), emptyLabel, 'xref label should not contain reference')

  getXref().click()
  const firstXref = editor.find('.sc-edit-xref-tool .se-option .sc-preview')
  firstXref.click()
  t.equal(getXref().text(), 'Supplementary File 1', 'xref label should be equal to supplementary file label')

  // insert another supplement before
  setCursor(editor, 'p1.content', 1)
  const workflow = _openWorkflow(editor)
  if (platform.inNodeJS) {
    t.doesNotThrow(() => {
      workflow.find('.sc-file-upload input').click()
    }, 'using tool should not throw')
  }
  doesNotThrowInNodejs(t, () => {
    workflow.find('.sc-file-upload')._selectFile(new PseudoFileEvent())
  }, 'triggering file upload should not throw')
  t.equal(getXref().text(), 'Supplementary File 2', 'xref label should be equal to second supplementary file label')
  // remove the referenced supplement
  editorSession.setSelection({
    type: 'node',
    nodeId: 'sm1',
    surfaceId: 'body',
    containerPath: ['body', 'content']
  })
  deleteSelection(editor)
  t.equal(getXref().text(), emptyLabel, 'xref should be broken and contain empty label')
  t.end()
})

test('Supplementary File: replace a file', t => {
  let { app } = setupTestApp(t, { archiveId: 'blank' })
  let editor = openManuscriptEditor(app)
  let editorSession = getEditorSession(editor)
  loadBodyFixture(editor, PARAGRAPH_AND_LOCAL_SUPPLEMENTARY_FILE)

  editorSession.setSelection({
    type: 'node',
    nodeId: 'sm1',
    surfaceId: 'body',
    containerPath: ['body', 'content']
  })
  t.ok(isToolEnabled(editor, 'file-tools', replaceSupplementaryFileToolSelector), 'replace supplementary file tool shoold be available')
  doesNotThrowInNodejs(t, () => {
    _getReplaceSupplementaryFileTool(editor).click()
  }, 'clicking on the replace supplementary file button should not throw error')
  doesNotThrowInNodejs(t, () => {
    _getReplaceSupplementaryFileTool(editor).onFileSelect(new PseudoFileEvent())
  }, 'triggering file upload for replace supplementary file should not throw')

  t.end()
})

function _testDownloadTool (mode, bodyXML, expectedDownloadUrl) {
  test(`Supplementary File: download a ${mode} file`, t => {
    let { app } = setupTestApp(t, fixture('assets'))
    let editor = openManuscriptEditor(app)
    loadBodyFixture(editor, bodyXML)

    let editorSession = getEditorSession(editor)
    editorSession.setSelection({
      type: 'node',
      nodeId: 'sm1',
      surfaceId: 'body',
      containerPath: ['body', 'content']
    })
    t.ok(isToolEnabled(editor, 'file-tools', downloadSupplementaryFileToolSelector), 'download supplementary file tool shoold be available')

    let downloadTool = _getDownloadSupplementaryFileTool(editor)
    let downloadLink = downloadTool.refs.link
    // ATTENTION: in the browser we intercept the click on the link because
    // it is annoying if during tests files are actually downloaded
    if (platform.inBrowser) {
      downloadLink.el.click = () => {}
    }
    doesNotThrowInNodejs(t, () => {
      downloadTool.click()
    }, 'clicking on the download supplementary file button should not throw error')

    t.equal(downloadLink.attr('href'), expectedDownloadUrl, 'the correct download url should have been used')

    t.end()
  })
}
_testDownloadTool('local', PARAGRAPH_AND_LOCAL_SUPPLEMENTARY_FILE, LOCAL_ASSET_URL)
_testDownloadTool('remote', PARAGRAPH_AND_REMOTE_SUPPLEMENTARY_FILE, REMOTE_ASSET_URL)

function _getInsertSupplementaryFileTool (editor) {
  return openMenuAndFindTool(editor, 'insert', insertSupplementaryFileToolSelector)
}

function _getDownloadSupplementaryFileTool (editor) {
  return openMenuAndFindTool(editor, 'file-tools', downloadSupplementaryFileToolSelector)
}

function _getReplaceSupplementaryFileTool (editor) {
  return openMenuAndFindTool(editor, 'file-tools', replaceSupplementaryFileToolSelector)
}

function _isToolEnabled (editor) {
  return isToolEnabled(editor, 'insert', '.sm-insert-file')
}

function _openWorkflow (editor) {
  // open the add drop down and find tool
  const tool = _getInsertSupplementaryFileTool(editor)
  tool.click()
  let workflow = editor.find('.se-workflow-modal')
  return workflow
}
