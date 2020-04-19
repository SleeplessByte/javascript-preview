import React, { RefObject } from 'react'
import MonacoEditor, { EditorDidMount, ChangeHandler } from 'react-monaco-editor'
import { on as onEvent, emit as emitEvent } from './useEvent'

type EditorProps ={
  language: string
  codeRef: RefObject<string>
  onCodeUpdated: (nextCode: string) => void
}

export class Editor extends React.Component<EditorProps, { code: string, error: Error | undefined }> {
  subscriptions: Array<(() => void)>

  constructor(props: EditorProps) {
    super(props)
    this.state = {
      error: undefined,
      code: props.codeRef.current || '// type your code...\n',
    }

    this.onChange = this.onChange.bind(this)
    this.editorDidMount = this.editorDidMount.bind(this)
    this.subscriptions = []
  }

  componentDidCatch(err: Error) {
    this.setState((p) => ({ ...p, error: err }))
  }

  editorDidMount(
    editor: Parameters<EditorDidMount>[0],
    monaco: Parameters<EditorDidMount>[1]
  ) {
    editor.focus()
    editor.setPosition({ lineNumber: 2, column: 1 })

    const onCommandPallete = () => editor.trigger('', 'editor.action.quickCommand', undefined)
    const onExport = () => editor.trigger('event', 'preview.action.export', undefined)

    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'preview.action.export',

      // A label of the action that will be presented to the user.
      label: 'Export',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_E,
      ],

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: function( editor ) {
       const model = editor.getModel()
       if (model) {
        console.log(model.getValue())
       }
      }
    });

    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'preview.action.exercise.refresh',

      // A label of the action that will be presented to the user.
      label: 'Refresh Exercise',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_R,
      ],

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: function( editor ) {
       emitEvent('refresh')
      }
    });

    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'preview.action.view.instructions',

      // A label of the action that will be presented to the user.
      label: 'View Instructions',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I,
      ],

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: function( editor ) {
       emitEvent('instructions')
      }
    });

    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'preview.action.view.hints',

      // A label of the action that will be presented to the user.
      label: 'View Hints',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_H,
      ],

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: function( editor ) {
       emitEvent('hints')
      }
    });

    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'preview.action.run.tests',

      // A label of the action that will be presented to the user.
      label: 'Run Tests',
      keybindings: [
        monaco.KeyCode.F2
      ],

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: function( editor ) {
       emitEvent('executeTests')
      }
    });

    this.subscriptions.push(onEvent('commands', onCommandPallete))
    this.subscriptions.push(onEvent('export', onExport))
  }

  componentWillUnmount() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
  }

  onChange(
    newValue: Parameters<ChangeHandler>[0],
    e: Parameters<ChangeHandler>[1]
  ) {
    //
    this.props.onCodeUpdated(newValue)
  }

  render() {
    const code = this.state.code

    const options = {
      selectOnLineNumbers: true,
      glyphMargin: true,
      fontLigatures: true,
      automaticLayout: true,
    }

    if (this.state.error) {
      return (
        <section>
          <p>{this.state.error.message}</p>
        </section>
      )
    }

    return (
      <MonacoEditor
        language={this.props.language}
        theme="vs-dark"
        defaultValue={code}
        options={options}
        onChange={this.onChange}
        editorDidMount={this.editorDidMount}
      />
    )
  }
}
