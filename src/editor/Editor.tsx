import React, { RefObject } from 'react'
import MonacoEditor, { EditorDidMount, ChangeHandler, EditorWillMount } from 'react-monaco-editor'
import { on as onEvent, emit as emitEvent } from './useEvent'

type EditorProps = {
  types: string | undefined
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
    this.editorWillMount = this.editorWillMount.bind(this)
    this.subscriptions = []
  }

  componentDidCatch(err: Error) {
    this.setState((p) => ({ ...p, error: err }))
  }

  editorWillMount(
    monaco: Parameters<EditorWillMount>[0]
  ) {

    if (this.props.types) {
      monaco.languages.typescript.javascriptDefaults.addExtraLib([
        this.props.types
      ].join('\n'), 'ts:filename/global.d.ts');
    }
  }

  editorDidMount(
    editor: Parameters<EditorDidMount>[0],
    monaco: Parameters<EditorDidMount>[1]
  ) {
    editor.focus()
    editor.setPosition({ lineNumber: 2, column: 1 })

    const onCommandPallete = () => setTimeout(() => editor.trigger('', 'editor.action.quickCommand', undefined), 0)
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
        monaco.KeyCode.F10,
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_I
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
        monaco.KeyCode.F11,
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_H
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
        monaco.KeyCode.F2,
        monaco.KeyMod.Shift | monaco.KeyCode.Enter
      ],

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: function( editor ) {
       emitEvent('executeTests')
      }
    });

    editor.addAction({
      // An unique identifier of the contributed action.
      id: 'preview.action.exercise.save',

      // A label of the action that will be presented to the user.
      label: 'Save Exercise',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S
      ],

      // Method that will be executed when the action is triggered.
      // @param editor The editor instance is passed in as a convinience
      run: function( editor ) {
       emitEvent('notification', {
         title: 'Auto-saving enabled',
         details: 'Your code is automatically stored as you type, as long as there is enough space on your device.'
        })
      }
    });

    this.subscriptions.push(onEvent('commands', onCommandPallete))
    this.subscriptions.push(onEvent('export', onExport))
    this.subscriptions.push(onEvent('focus', editor.focus.bind(editor)))
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
        editorWillMount={this.editorWillMount}
      />
    )
  }
}
