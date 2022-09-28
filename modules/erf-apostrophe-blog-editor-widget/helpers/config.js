export default (includeSavePlugin) => {
  let saveList = 
  includeSavePlugin 
    ? ['save', 'savePlugin', 'template']
    : ['save', 'template']

  return {
    mode: 'classic',
    tagsBlacklist: 'h1',
    width: '100%',
    height: 'auto',
    rtl: false,
    buttonList: [
      ['undo', 'redo'],
      ['font', 'fontSize', 'formatBlock'],
      ['paragraphStyle', 'blockquote'],
      ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
      ['fontColor', 'hiliteColor', 'textStyle'],
      ['removeFormat'],
      '/', // Line break
      ['outdent', 'indent'],
      ['align', 'horizontalRule', 'list', 'lineHeight'],
      ['aposImageModal', 'aposFileModal', 'aposVideoModal', 'table', 'link', 'image', 'video', 'audio' /** ,'math' */], // You must add the 'katex' library at options to use the 'math' plugin.
      /** ['imageGallery'] */ // You must add the "imageGalleryUrl".
      ['fullScreen', 'showBlocks', 'codeView'],
      ['preview', 'print'],
      saveList
      /** ['dir', 'dir_ltr', 'dir_rtl'] */ // "dir": Toggle text direction, "dir_ltr": Right to Left, "dir_rtl": Left to Right
    ]
  }
}