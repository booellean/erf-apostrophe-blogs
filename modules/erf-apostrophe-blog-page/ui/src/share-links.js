export default () => {
    window.apos.util.widgetPlayers['erf-apostrophe-blog-page'] =
    {
        selector: '[data-entry="article"]',
        player: function (el) {
            const tagField = el.querySelector('#tags')
            const timeField = el.querySelector('#publish-date')
            const shareField = el.querySelector('#share-links-container')

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.standalone || window.matchMedia('display-mode: standalone').matches
            let tags = []
            if(tagField) tags = tagField.dataset.tags.split(',')

            if(shareField){
                let moduleSettings = window.apos.modules['erf-apostrophe-blog-page'].pageSettings;
                let articleSettings = window.ArticleSettings || {}
                let mobileIcons = `
                <div class="share-btn">
                    <a class="social-button-link" href="/">
                        <span class="social-button mobile">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M575.8 255.5C575.8 273.5 560.8 287.6 543.8 287.6H511.8L512.5 447.7C512.5 450.5 512.3 453.1 512 455.8V472C512 494.1 494.1 512 472 512H456C454.9 512 453.8 511.1 452.7 511.9C451.3 511.1 449.9 512 448.5 512H392C369.9 512 352 494.1 352 472V384C352 366.3 337.7 352 320 352H256C238.3 352 224 366.3 224 384V472C224 494.1 206.1 512 184 512H128.1C126.6 512 125.1 511.9 123.6 511.8C122.4 511.9 121.2 512 120 512H104C81.91 512 64 494.1 64 472V360C64 359.1 64.03 358.1 64.09 357.2V287.6H32.05C14.02 287.6 0 273.5 0 255.5C0 246.5 3.004 238.5 10.01 231.5L266.4 8.016C273.4 1.002 281.4 0 288.4 0C295.4 0 303.4 2.004 309.5 7.014L564.8 231.5C572.8 238.5 576.9 246.5 575.8 255.5L575.8 255.5z"/></svg>
                        </span>
                    </a>
                    <a class="social-button-link" href="${articleSettings.moreUrl}?${tags.map( tag => `tags=${tag}`).join('&')}">
                        <span class="social-button mobile">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M472.8 168.4C525.1 221.4 525.1 306.6 472.8 359.6L360.8 472.9C351.5 482.3 336.3 482.4 326.9 473.1C317.4 463.8 317.4 448.6 326.7 439.1L438.6 325.9C472.5 291.6 472.5 236.4 438.6 202.1L310.9 72.87C301.5 63.44 301.6 48.25 311.1 38.93C320.5 29.61 335.7 29.7 344.1 39.13L472.8 168.4zM.0003 229.5V80C.0003 53.49 21.49 32 48 32H197.5C214.5 32 230.7 38.74 242.7 50.75L410.7 218.7C435.7 243.7 435.7 284.3 410.7 309.3L277.3 442.7C252.3 467.7 211.7 467.7 186.7 442.7L18.75 274.7C6.743 262.7 0 246.5 0 229.5L.0003 229.5zM112 112C94.33 112 80 126.3 80 144C80 161.7 94.33 176 112 176C129.7 176 144 161.7 144 144C144 126.3 129.7 112 112 112z"/></svg>
                        </span>
                    </a>
                    <a class="social-button-link" data-id="share">
                        <span class="social-button mobile">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M568.9 143.5l-150.9-138.2C404.8-6.773 384 3.039 384 21.84V96C241.2 97.63 128 126.1 128 260.6c0 54.3 35.2 108.1 74.08 136.2c12.14 8.781 29.42-2.238 24.94-16.46C186.7 252.2 256 224 384 223.1v74.2c0 18.82 20.84 28.59 34.02 16.51l150.9-138.2C578.4 167.8 578.4 152.2 568.9 143.5zM416 384c-17.67 0-32 14.33-32 32v31.1l-320-.0013V128h32c17.67 0 32-14.32 32-32S113.7 64 96 64H64C28.65 64 0 92.65 0 128v319.1c0 35.34 28.65 64 64 64l320-.0013c35.35 0 64-28.66 64-64V416C448 398.3 433.7 384 416 384z"/></svg>
                        </span>
                    </a>
                </div>
                `
                if(isMobile){
                    shareField.innerHTML = mobileIcons
                }else{
                    shareField.innerHTML - articleSettings.icons
                }
                shareField.innerHTML = articleSettings.icons + mobileIcons

                this.loadLibrary()

            }

            if(timeField) this.formatDate(timeField)
        },
        formatDate: function(timeField){
            console.log('formatting dater')
            let time = timeField.getAttribute('datetime')
            if(time){
                const localDate = new Date(time);
                timeField.innerHTML = `Published on ${localDate.toLocaleDateString('en-us', { year: 'numeric', month: 'long', day:'numeric' })} at ${localDate.toLocaleTimeString('en-US')}` 
            }
        },
        // Load the library after link html has been built
        loadLibrary(){
            require('share-buttons/dist/share-buttons')
        }
    }
};
