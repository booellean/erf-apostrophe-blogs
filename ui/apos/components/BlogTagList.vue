<template>
    <p
        class="apos-table__cell-field"
        :class="`apos-table__cell-field--${header.name}`"
    >
        <ul v-if="tags.length > 0">
            <li
                v-for="tag in tags"
                :key="tag.slug"
            >
                {{ tag.slug }}
            </li>
        </ul>
    </p>
</template>

<script>
export default {
    name: 'BlogTagList',

    data(){
        return {
            tags: (this.$attrs.item._tags || []).sort( (a,b) => {
                if(a.slug < b.slug) return -1
                if(a.slug > b.slug) return 1
                return 0
            }),
            header: this.$attrs.header
        }
    },

    mounted(){
        console.log(this)
    }
}
</script>
<style scoped>
    ul {
        margin: 0;
        padding: 0;
        list-style: none;
        padding: 0;
        display: flex;
    }
    li:not(:first-child)::before {
        content: ', ';
        color: var(--a-base-4);
    }
    p.apos-table__cell-field{
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 17rem;
    }
</style>