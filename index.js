const { Plugin } = require('powercord/entities')
const { inject, uninject } = require('powercord/injector')
const { FluxDispatcher: Dispatcher, getModule } = require('powercord/webpack')

module.exports = class extends Plugin {
   async startPlugin() {
      this.userStore = getModule(['getCurrentUser', 'getUser'], false)
      this.guildStore = getModule(['getGuild'], false)

      this.cachedGuilds = [...this.guildStore.getGuilds()]

      Dispatcher.subscribe('RELATIONSHIP_REMOVE', this.relationshipCallback)
      Dispatcher.subscribe('GUILD_MEMBER_REMOVE', this.memberRemoveCallback)
      Dispatcher.subscribe('GUILD_BAN_ADD', this.banCallback)

      this.mostRecentlyRemovedID = null
      this.mostRecentlyLeftGuild = null

      const relationshipModule = getModule(['removeRelationship'], false)
      inject('rn-relationship-check', relationshipModule, 'removeRelationship', (args, res) => {
         this.mostRecentlyRemovedID = args[0]
         return res
      })

      const leaveGuild = getModule(['leaveGuild'], false)
      inject('rn-guild-leave-check', leaveGuild, 'leaveGuild', (args, res) => {
         console.log(args)
         this.mostRecentlyLeftGuild = args[0]
         this.removeGuildFromCache(args[0])
         return res
      })

      const joinGuild = getModule(['joinGuild'])
      inject('rn-guild-join-check', joinGuild, 'addGuild', (args, res) => {
         console.log(args, res)
         if (args[0] === this.mostRecentlyLeftGuild) this.mostRecentlyLeftGuild = null
         return res
      })
   }

   pluginWillUnload() {
      uninject('rn-relationship-check')
      uninject('rn-guild-join-check')
      uninject('rn-guild-leave-check')
      Dispatcher.unsubscribe('RELATIONSHIP_REMOVE', this.relationshipCallback)
      Dispatcher.unsubscribe('GUILD_MEMBER_REMOVE', this.memberRemoveCallback)
      Dispatcher.unsubscribe('GUILD_BAN_ADD', this.banCallback)
   }

   banCallback = (data) => {
      if (data.user.id !== this.userStore.getCurrentUser().id) return
      let guild = this.cachedGuilds.find(g => g.id == data.guildId)
      if (!guild || guild === null) return
      this.removeGuildFromCache(guild.id)
      powercord.api.notices.sendToast(`rn_${this.random(20)}`, {
         header: "You've been banned!",
         content: `Name: ${guild.name}`,
         type: 'danger',
         buttons: [
            {
               text: ':(',
               color: 'red',
               size: 'small',
               look: 'outlined'
            }
         ]
      })
   }

   relationshipCallback = (data) => {
      if (data.relationship.type === 3) return
      if (this.mostRecentlyRemovedID === data.relationship.id) {
         this.mostRecentlyRemovedID = null
         return
      }
      let user = this.userStore.getUser(data.relationship.id)
      if (!user || user === null) return
      powercord.api.notices.sendToast(`rn_${this.random(20)}`, {
         header: `Someone removed you`,
         content: `Tag: ${user.username}#${user.discriminator}`,
         type: 'danger',
         buttons: [
            {
               text: ':(',
               color: 'red',
               size: 'small',
               look: 'outlined'
            }
         ]
      })
      this.mostRecentlyRemovedID = null
   }

   memberRemoveCallback = (data) => {
      if (this.mostRecentlyLeftGuild === data.guildId) {
         this.mostRecentlyLeftGuild = null
         return
      }
      if (data.user.id !== this.userStore.getCurrentUser().id) return
      let guild = this.cachedGuilds.find(g => g.id == data.guildId)
      if (!guild || guild === null) return
      this.removeGuildFromCache(guild.id)
      powercord.api.notices.sendToast(`rn_${this.random(20)}`, {
         header: "You've been kicked!",
         content: `Server Name: ${guild.name}`,
         type: 'danger',
         buttons: [
            {
               text: ':(',
               color: 'red',
               size: 'small',
               look: 'outlined'
            }
         ]
      })
      this.mostRecentlyLeftGuild = null
   }
   
   removeGuildFromCache(id){
      const index = this.cachedGuilds.indexOf(this.cachedGuilds.find(g => g.id ==i d))
      if (index == -1) return
      this.cachedGuilds.splice(index,1)
   }

   random() {
      var result = ''
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (var i = 0; i < length; i++) {
         result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      return result
   }
}
