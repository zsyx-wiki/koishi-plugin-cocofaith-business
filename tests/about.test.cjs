const test = require('node:test')
const assert = require('node:assert/strict')
const business = require('../lib/index.js')
const businessVersion = require('../package.json').version
const coreVersion = '3.0.0-alpha.test'

test('about command reports runtime component versions and permits unregistered users', async () => {
  const command = business.createAboutModule().commands[0]
  assert.equal(command.allowUnregistered, true)
  const result = await command.execute({ core: { runtime: { apiVersion: '3.0', version: coreVersion, capabilities: [] } }, event: { uid: null, scene: 'group', content: '关于椰子水', adapter: { name: 'CoCoFaith Adapter Test', version: '1.2.3' } } })
  assert.equal(result.type, 'text')
  assert.match(result.content, /^关于椰子水/m)
  assert.match(result.content, /架构：Koishi \d+/)
  assert.match(result.content, new RegExp(`Core：CoCoFaith Core ${coreVersion.replaceAll('.', '\\.')}`))
  assert.match(result.content, new RegExp(`Business：CoCoFaith Business ${businessVersion.replaceAll('.', '\\.')}`))
  assert.match(result.content, /Adapter：CoCoFaith Adapter Test 1\.2\.3/)
})

test('Business protocol validates and preserves adapter metadata', () => {
  const identity = { adapter: 'qqbot', type: 'qqbot_member_openid', value: 'member', scope: 'group_chat', scopeValue: 'group' }
  const core = { adapter: { normalize: (value) => value } }
  const event = business.normalizeBusinessEvent(core, {
    uid: null, identity, scene: 'group', content: '关于椰子水', adapter: { name: ' CoCoFaith Adapter QQ ', version: ' 3.0.0-alpha.2 ' },
  })
  assert.deepEqual(event.adapter, { name: 'CoCoFaith Adapter QQ', version: '3.0.0-alpha.2', allowRegistration: false })
  assert.equal(Object.isFrozen(event.adapter), true)
  assert.throws(() => business.normalizeBusinessEvent(core, { uid: 1, scene: 'group', content: '关于椰子水', adapter: { name: '', version: '1' } }))
})
