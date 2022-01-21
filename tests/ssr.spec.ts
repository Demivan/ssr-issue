import { expect, test } from 'vitest'

import { Component, createApp, h, withDirectives } from 'vue'
import { renderToString } from 'vue/server-renderer'

const directive = {
  beforeMount (el) {
    el.style.display = 'none'
  },
  getSSRProps () {
    return { style: { display: 'none' } }
  }
}

test('sanity check: v-show works with ssr', async() => {
  const component: Component = {
    template: '<div v-show="false"></div>'
  }
  const app = createApp(component)
  const rendered = await renderToString(app)

  expect(app._component.ssrRender.toString()).toMatchInlineSnapshot(`
    "function ssrRender(_ctx, _push, _parent, _attrs) {
      _push(\`<div\${_ssrRenderAttrs(_mergeProps({
        style: false ? null : { display: \\"none\\" }
      }, _attrs))}></div>\`)
    }"
  `)

  expect(rendered).toMatchInlineSnapshot('"<div style=\\"display:none;\\"></div>"')
})

/// Actual failing test
test('v-custom-show does not work with ssr', async() => {
  const component: Component = {
    directives: {
      customShow: directive
    },
    template: '<div v-custom-show="false"></div>'
  }
  const app = createApp(component)
  const rendered = await renderToString(app)

  expect(app._component.ssrRender.toString()).toMatchInlineSnapshot(`
    "function ssrRender(_ctx, _push, _parent, _attrs) {
      _push(\`<div\${_ssrRenderAttrs(_attrs)}></div>\`)
    }"
  `)

  expect(rendered).toMatchInlineSnapshot('"<div style=\\"display:none;\\"></div>"')
})

test('v-custom-show works with ssr when render function is used', async() => {
  const component: Component = {
    render() {
      return withDirectives(h("div"), [
        [directive]
      ])
    }
  }
  const app = createApp(component)
  const rendered = await renderToString(app)

  expect(rendered).toMatchInlineSnapshot('"<div style=\\"display:none;\\"></div>"')
})

test('v-custom-show works with regular render', async () => {
  const component: Component = {
    directives: {
      customShow: directive
    },
    template: '<div v-custom-show="false"></div>'
  }
  const app = createApp(component)
  const root = document.createElement('div')
  app.mount(root)

  expect(app._component.render.toString()).toMatchInlineSnapshot(`
    "function render(_ctx, _cache) {
      with (_ctx) {
        const { resolveDirective: _resolveDirective, withDirectives: _withDirectives, openBlock: _openBlock, createElementBlock: _createElementBlock } = _Vue
    
        const _directive_custom_show = _resolveDirective(\\"custom-show\\")
    
        return _withDirectives((_openBlock(), _createElementBlock(\\"div\\", null, null, 512 /* NEED_PATCH */)), [
          [_directive_custom_show, false]
        ])
      }
    }"
  `)

  expect(root.outerHTML).toMatchInlineSnapshot('"<div data-v-app=\\"\\"><div style=\\"display: none;\\"></div></div>"')
})