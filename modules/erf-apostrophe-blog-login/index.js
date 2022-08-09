module.exports = {
    improve: '@apostrophecms/login',
    extendMethods(self) {
        return {
            getBrowserData(_super, req) {
                let data = _super(req)
                if(req.user){
                    let image = ''
                    if(req.user.gravatarUrl){
                        image = req.user.gravatarUrl
                    }else if(req.user._profileImage){
                        let imageObj = self.apos.image.first(req.user._profileImage)
                        image = self.apos.attachment.url(imageObj, { size: 'one-third' })
                    }

                    data.user.firstName = req.user.firstName
                    data.user.lastName = req.user.lastName
                    data.user.twitterHandle = req.user.twitterHandle
                    data.user.profileImage = image
                }
                return data
            }
        }
    }
}