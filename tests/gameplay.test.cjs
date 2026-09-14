const test = require("node:test")
const assert = require("node:assert/strict")
const Module = require("node:module")

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === "@mueo/koishi-plugin-cocofaith-core") {
    return require("../../koishi-plugin-cocofaith-core/lib/index.js")
  }
  return originalLoad.call(this, request, parent, isMain)
}

const business = require("../lib/index.js")

test("defineGameplay turns one config declaration into defaults and validation", () => {
  const config = business.defineGameplayConfig({
    rewardGold: business.gameplayInteger(50, { min: 0, max: 100 }),
    publicNotice: business.gameplayBoolean(false),
  })

  assert.deepEqual(config.defaults, { rewardGold: 50, publicNotice: false })
  assert.deepEqual(config.parse({ rewardGold: 80, publicNotice: true }), {
    rewardGold: 80,
    publicNotice: true,
  })
  assert.throws(() => config.parse({ rewardGold: 101, publicNotice: false }))
})

test("simple atomic gameplay receives uid, state and reward helpers and may return text", async () => {
  const definition = business.defineGameplay({
    name: "daily_fish",
    config: business.defineGameplayConfig({
      rewardGold: business.gameplayInteger(50, { min: 0, max: 100 }),
    }),
    setup({ config }) {
      return { label: `奖励 ${config.rewardGold}` }
    },
    commands: [{
      id: "play",
      triggers: ["摸鱼", "每日摸鱼"],
      scenes: ["group"],
      atomic: "user",
      async run({ uid, state, economy, config, service }) {
        assert.equal(uid, 10000000)
        assert.equal(service.label, "奖励 50")
        assert.equal(state.gameDay, "2026-09-12")
        state.data.date = state.gameDay
        const reward = await economy.reward({ gold: config.rewardGold })
        return `摸鱼成功，获得 ${reward.applied.gold} 金币。`
      },
    }],
  })

  const module = business.adaptGameplayDefinition(definition)
  const moduleContext = {
    name: definition.name,
    core: {},
    config: module.validateConfig(module.defaultConfig),
    provide() {}, use() {}, contribute() {}, collect() {},
  }
  await module.init(moduleContext)

  let saved
  let transactionOptions
  let rewardOptions
  const tx = {
    data: {
      get: async () => ({ private: {}, public: {} }),
      set: async (value) => { saved = value },
    },
    economy: {
      getWallet: async () => ({}),
      canAfford: async () => true,
      pay: async () => ({}),
      creditFixed: async () => ({}),
      reward: async (amount, options) => {
        rewardOptions = options
        return { applied: amount }
      },
    },
    items: {},
    users: {},
  }
  const core = {
    gameDay: { currentDate: () => "2026-09-12" },
    transaction: {
      run: async (_uid, task, options) => {
        transactionOptions = options
        return task(tx)
      },
    },
  }
  const result = await module.commands[0].execute({
    uid: 10000000,
    event: { uid: 10000000, scene: "group", content: "摸鱼", eventId: "message-1" },
    args: [],
    path: ["play"],
    core,
    config: moduleContext.config,
  })

  assert.deepEqual(result, { type: "text", content: "摸鱼成功，获得 50 金币。" })
  assert.deepEqual(saved, { private: { date: "2026-09-12" }, public: {} })
  assert.equal(transactionOptions.source, "daily_fish.play")
  assert.match(transactionOptions.idempotencyKey, /^daily_fish:play:/)
  assert.equal(rewardOptions.source, "daily_fish.play")
})

test("simple gameplay is registered-only by default and guest is explicit", () => {
  const registered = business.adaptGameplayDefinition(business.defineGameplay({
    name: "registered_probe",
    commands: [{ id: "probe", triggers: ["检查"], run: () => "ok" }],
  }))
  const guest = business.adaptGameplayDefinition(business.defineGameplay({
    name: "guest_probe",
    commands: [{ id: "probe", triggers: ["公开检查"], guest: true, run: () => "ok" }],
  }))

  assert.equal(registered.commands[0].allowUnregistered, false)
  assert.equal(guest.commands[0].allowUnregistered, true)
  assert.equal(business.defineAdvancedGameplay, business.defineBusinessModule)
})

test("simple gameplay fail helper becomes a normal Business error", async () => {
  const module = business.adaptGameplayDefinition(business.defineGameplay({
    name: "failure_probe",
    commands: [{
      id: "probe",
      triggers: ["失败检查"],
      run() {
        business.fail("LIMIT_REACHED", "今天没有次数了。")
      },
    }],
  }))

  await assert.rejects(
    () => module.commands[0].execute({
      uid: 10000000,
      event: { uid: 10000000, scene: "group", content: "失败检查" },
      args: [],
      path: ["probe"],
      core: {},
      config: {},
    }),
    (error) => error.code === "LIMIT_REACHED" && error.message === "今天没有次数了。",
  )
})
