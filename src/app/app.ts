import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

type Block={id:string,type:string,data:any}; type Lesson={id?:string,title:string,durationMin:number,content:Block[]};
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule,DragDropModule],templateUrl:'./app.html',styleUrl:'./app.scss'})
export class App{
 private http=inject(HttpClient); api='https://edukacije.onrender.com/api'; view=signal<'login'|'dashboard'|'editor'|'templates'|'reports'>('login'); user=signal<any>(null); courses=signal<any[]>([]); templates=signal<any[]>([]); active=signal<any>(null); activeLesson=signal(0); saving=signal(false); toast=signal('');
 email='demo@edustudio.local'; password='demo1234'; name=''; registerMode=false; search=''; aiText='';
 palette=[['text','Tekst','T'],['image','Slika','▧'],['button','Tipka','↗'],['single','Single choice','◉'],['multi','Multi choice','☑'],['textarea','Pisani odgovor','≡'],['matching','Spajanje pojmova','⇄'],['dropzone','Box u box','⬚']];
 filtered=computed(()=>this.courses().filter(c=>c.title.toLowerCase().includes(this.search.toLowerCase())));
 constructor(){const t=localStorage.getItem('token');if(t){this.view.set('dashboard');this.loadAll()}else this.loadTemplates()}
 notify(x:string){this.toast.set(x);setTimeout(()=>this.toast.set(''),2500)}
 login(){this.http.post<any>(`${this.api}/auth/${this.registerMode?'register':'login'}`,{email:this.email,password:this.password,name:this.name||'Novi korisnik'}).subscribe({next:r=>{localStorage.setItem('token',r.token);this.user.set(r.user);this.view.set('dashboard');this.loadAll()},error:e=>this.notify(e.error?.message||'Prijava nije uspjela')})}
 logout(){localStorage.removeItem('token');this.view.set('login')}
 loadTemplates(){this.http.get<any[]>(`${this.api}/templates`).subscribe(x=>this.templates.set(x))}
 loadAll(){this.loadTemplates();this.http.get<any[]>(`${this.api}/courses`).subscribe(x=>this.courses.set(x))}
 newCourse(template?:any){const data=template?.courseData||{};this.http.post<any>(`${this.api}/courses`,{title:template?.name||'Nova edukacija',description:template?.description||'',lessons:data.lessons||undefined}).subscribe(c=>{this.courses.update(x=>[c,...x]);this.open(c)})}
 open(c:any){this.http.get<any>(`${this.api}/courses/${c.id}`).subscribe(x=>{this.active.set(x);this.activeLesson.set(0);this.view.set('editor')})}
 lesson(){return this.active()?.lessons?.[this.activeLesson()]}
 addLesson(){const c=this.active();c.lessons.push({title:`Lekcija ${c.lessons.length+1}`,durationMin:5,content:[]});this.active.set({...c});this.activeLesson.set(c.lessons.length-1)}
 addBlock(type:string){const l=this.lesson();if(!l)return;const defaults:any={text:{text:'Kliknite i uredite tekst lekcije.'},image:{url:'https://placehold.co/900x420?text=Slika',alt:'Slika'},button:{text:'Saznaj više',url:'#'},single:{question:'Odaberite točan odgovor',options:['Odgovor A','Odgovor B'],correct:[0],explanation:'Objašnjenje odgovora.'},multi:{question:'Odaberite sve točne odgovore',options:['Opcija 1','Opcija 2','Opcija 3'],correct:[0,2]},textarea:{question:'Upišite odgovor'},matching:{question:'Spojite pojmove',pairs:[['Pojam A','Opis A'],['Pojam B','Opis B']]},dropzone:{question:'Povucite elemente u odgovarajuće skupine',groups:['Skupina 1','Skupina 2'],items:['Element A','Element B']}};l.content.push({id:crypto.randomUUID(),type,data:defaults[type]});this.active.set({...this.active()})}
 dropBlocks(e:CdkDragDrop<Block[]>){moveItemInArray(this.lesson().content,e.previousIndex,e.currentIndex);this.active.set({...this.active()})}
 removeBlock(i:number){this.lesson().content.splice(i,1);this.active.set({...this.active()})}
 save(){this.saving.set(true);this.http.put(`${this.api}/courses/${this.active().id}`,this.active()).subscribe({next:()=>{this.saving.set(false);this.notify('Edukacija je spremljena')},error:()=>{this.saving.set(false);this.notify('Greška pri spremanju')}})}
 removeCourse(c:any){if(confirm(`Obrisati "${c.title}"?`))this.http.delete(`${this.api}/courses/${c.id}`).subscribe(()=>this.courses.update(x=>x.filter(y=>y.id!==c.id)))}
 export(kind:'pptx'|'scorm'){window.open(`${this.api}/courses/${this.active().id}/export/${kind}?token=${localStorage.getItem('token')}`,'_blank')}
 upload(ev:any){const f=ev.target.files?.[0];if(!f)return;const fd=new FormData();fd.append('file',f);this.http.post<any>(`${this.api}/assets`,fd).subscribe(a=>{this.addBlock('image');this.lesson().content.at(-1)!.data={url:`http://localhost:3000${a.path}`,alt:a.name};this.notify('Datoteka je učitana')})}
 generateAi(){if(!this.aiText.trim())return;this.http.post<any>(`${this.api}/ai/outline`,{text:this.aiText}).subscribe({next:r=>{const items=Array.isArray(r)?r:r.lessons||[];const c=this.active();for(const x of items)c.lessons.push({title:x.title||'AI lekcija',durationMin:5,content:(x.blocks||[{type:'text',text:x.summary}]).map((b:any)=>({id:crypto.randomUUID(),type:b.type==='quiz'?'single':'text',data:b.type==='quiz'?{question:b.question,options:b.options||[],correct:[0]}:{text:b.text||b.content||x.summary}}))});this.active.set({...c});this.notify('AI prijedlog je dodan')},error:e=>this.notify(e.error?.message||'AI nije dostupan')})}
 reportCourse:any=null; report:any=null; showReport(c:any){this.reportCourse=c;this.http.get<any>(`${this.api}/reports/${c.id}`).subscribe(r=>{this.report=r;this.view.set('reports')})}
}
