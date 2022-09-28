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
                    }else if(req.user._profileImage && req.user._profileImage[0]){
                        let imageObj = self.apos.image.first(req.user._profileImage)
                        image = self.apos.attachment.url(imageObj, { size: 'one-third' })
                    }

                    data.user = req.user
                    data.user.profileImage = image
                }
                return data
            }
        }
    }
}