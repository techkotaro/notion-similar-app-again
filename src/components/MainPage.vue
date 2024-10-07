<template>
  <div class="main-page">
    <div class="left-menu" @click.self="onEditNoteEnd">
    <!-- 保存ボタン -->
      <button class="transparent" @click="onClickButtonSave">
        <i class="fas fa-save"></i> 内容を保存
      </button>
     <draggable v-bind:list="noteList" group="notes">
        <NoteItem
            v-for="note in noteList"
            v-bind:initialNote="note"
            v-bind:layerProps="1"
            v-bind:key="note.id"
            @delete="onDeleteNote"
            @editStart="onEditNoteStart"
            @editEnd="onEditNoteEnd"
            @update:initialNote="updateParentNote(note.id,$event)"
            @addChild="onAddChildNote"
            @addNoteAfter="onAddNoteAfter"
            @select="onSelectNote"
        />
    </draggable>
     <!-- ノート追加ボタン -->
      <button class="transparent" @click="onClickButtonAdd">
        <i class="fas fa-plus-square"></i>ノートを追加
      </button>
    </div>
    <div class="right-view" @click.self="onEditNoteEnd()">
      <!--右ビュー-->
        <template v-if="selectedNote == null">
            <div class="no-selected-note">ノートを選択してください</div>
        </template>
        <template v-else>
            <div class="path">
                <small>{{selectedPath}}</small>
            </div>
            <div class="note-content">
                <h3 class="note-title">{{selectedNote.name}}</h3>
                <draggable v-bind:list="selectedNote.widgetList" group="widgets">
                    <WidgetItem
                    v-for="widget in selectedNote.widgetList"
                    v-bind:widgetProps="widget"
                    v-bind:layerProps="1"
                    v-bind:key="widget.id"
                    @delete="onDeleteWidget"
                    @addChild="onAddChildWidget"
                    @addWidgetAfter="onAddWidgetAfter"
                    />
                </draggable>
                <button class="transparent" @click="onClickButtonAddWidget">
                    <i class="fas fa-plus-square"></i>ウィジェットを追加
                </button>
            </div>
        </template>
    </div>
  </div>
</template>
<script>
import NoteItem from '@/components/parts/NoteItem.vue'
import draggable from 'vuedraggable'
import WidgetItem from '@/components/parts/WidgetItem.vue'

export default {
    components: { 
        NoteItem,
        draggable,
        WidgetItem,
    },
    data(){
        return{
            noteList:[],
            selectedNote : null,
        }
    },
    created: function() {
        const localData = localStorage.getItem('noteItem');
        if (localData != null)  {
        this.noteList = JSON.parse(localData);
            }
    },
    methods:{
        onClickButtonSave : function() {
            localStorage.setItem('noteItem', JSON.stringify(this.noteList));
            this.$toasted.show('ノートを保存しました', {
                position: 'top-left',
                duration: 1000,
                type: 'success'
            });
        },
        onAddNoteCommon : function(targetList, layer, index) {
            layer = layer || 1;
            const note = {
                id : new Date().getTime().toString(16),
                name : `新規ノート-${layer}-${targetList.length}`,
                mouseover : true,
                editing : false,
                selected : false,
                children : [],
                layer : layer,
                widgetList : [],
            };
            this.onAddWidgetCommon(note.widgetList);
            if (index == null) {
                targetList.push(note);
            } else {
                targetList.splice(index + 1, 0, note);
            }
        },
        onClickButtonAdd:function(){
            this.onAddNoteCommon(this.noteList);
        },
        onAddChildNote : function(note) {
            this.onAddNoteCommon(note.children, note.layer + 1);
        },
        onAddNoteAfter : function(parentNote, note) {
            const targetList = parentNote == null ? this.noteList : parentNote.children;
            const layer = parentNote == null ? 1 : note.layer;
            const index = targetList.indexOf(note);
            this.onAddNoteCommon(targetList, layer, index);
        },
        onAddWidgetCommon : function(targetList, layer, index) {
            layer = layer || 1;
            const widget = {
                id : new Date().getTime().toString(16),
                type : layer === 1 ? 'heading' : 'body',
                text : '',
                mouseover : false,
                children : [],
                layer : layer,
            };
            if (index == null) {
                targetList.push(widget);
            } else {
                targetList.splice(index + 1, 0, widget);
            }  
        },
        onClickButtonAddWidget : function() {
            this.onAddWidgetCommon(this.selectedNote.widgetList);
        },
        onAddChildWidget : function(widget) {
            this.onAddWidgetCommon(widget.children, widget.layer + 1);
        },
        onAddWidgetAfter : function(parentWidget, note) {
            const targetList = parentWidget == null ? this.selectedNote.widgetList : parentWidget.children;
            const layer = parentWidget == null ? null : parentWidget.layer + 1;
            const index = targetList.indexOf(note);
            this.onAddWidgetCommon(targetList, layer, index);
        },
        onDeleteWidget : function(parentWidget, widget) {
            const targetList = parentWidget == null ? this.selectedNote.widgetList : parentWidget.children;
            const index = targetList.indexOf(widget);
            targetList.splice(index, 1);

            // 削除した1つ前のウィジェットを選択状態にする
            const focusWidget = (index === 0) ? parentWidget : targetList[index - 1];
            if (focusWidget != null) {
                focusWidget.id = (parseInt(focusWidget.id, 16) + 1).toString(16);
            }
        },
        onDeleteNote : function(parentNote, note) {
            const targetList = parentNote == null ? this.noteList : parentNote.children;
            const index = targetList.indexOf(note);
            targetList.splice(index, 1);
        },
        onEditNoteStart : function(editNote, parentNote) {
            const targetList = parentNote == null ? this.noteList : parentNote.children;
            for (let note of targetList) {
                note.editing = (note.id === editNote.id);
                this.onEditNoteStart(editNote, note); // 子ノートを基準として再帰的に呼び出し
            }
        },
        onEditNoteEnd : function(parentNote) {
            const targetList = parentNote == null ? this.noteList : parentNote.children;
            for (let note of targetList) {
                note.editing = false;
                this.onEditNoteEnd(note); // 子ノートを基準として再帰的に呼び出し
            }
        },
        onSelectNote : function(targetNote) {
            // 再帰的にノートの選択状態を更新
            const updateSelectStatus = (targetNote, noteList) => {
              for(let note of noteList) {
                note.selected=(note.id===targetNote.id)
                updateSelectStatus(targetNote, note.children)
              }
            }
            updateSelectStatus(targetNote, this.noteList);
            // 選択中ノート情報を更新
            this.selectedNote = targetNote;
        },
        //子コンポーネントからnote.nameの変更を受け取り、親のnoteListに反映
        updateParentNote(index,newNote){
            this.$set(this.noteList, index, newNote);
        },
    },
    computed: {
        selectedPath : function() {
        const searchSelectedPath = function(noteList, path) {
            for (let note of noteList) {
            const currentPath = path == null ? note.name : `${path} / ${note.name}`;
            if (note.selected) return currentPath;
            const selectedPath = searchSelectedPath(note.children, currentPath);
            if (selectedPath.length > 0) return selectedPath;
            }
            return '';
        }
        return searchSelectedPath(this.noteList);
        },
    },
    watch:{
        //noteListが変更されたか監視
        noteList:{
            handler(newList,oldList){
                console.log('noteListが変更されました');
                console.log('新しい noteList:', newList);
                console.log('古い noteList:', oldList);
            },
            deep:true,
        }
    }
}
</script>

<style scoped lang="scss">
.main-page {
  padding: 10px;
  display: flex;
  height: calc(100vh - 60px);
  .left-menu {
    width: 350px;
    background-color: #f7f6f3;
  }
  .right-view {
    flex-grow: 1;
    padding: 10px;
    .no-selected-note {
      text-align: center;
      font-size: 25px;
      margin: 20px;
    }
    .path {
      text-align: left;
      margin-bottom: 50px;      
    }
    .note-content {
      max-width: 900px;
      margin: 0 auto;
      text-align: left;
    .note-title {
        margin-bottom: 25px;
      }
    }
  }
}
</style>