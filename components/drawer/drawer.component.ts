import {
  Component,
  ViewEncapsulation,
  Input,
  HostBinding,
  Output,
  EventEmitter,
  ElementRef,
  OnChanges,
  AfterViewChecked,
  AfterViewInit,
  Type,
  TemplateRef,
  ViewChild,
  Renderer2,
  ViewContainerRef,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CdkPortalOutlet, TemplatePortal } from '@angular/cdk/portal';
import { Subject, Observable } from 'rxjs';
import { OverlayRef, Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

@Component({
  selector: 'Drawer, nzm-drawer',
  templateUrl: './drawer.component.html',
  encapsulation: ViewEncapsulation.None
})
export class DrawerComponent implements OnInit, AfterViewChecked, OnChanges, AfterViewInit, OnDestroy {
  prefixCls: string = 'am-drawer';
  styleFinal: { [k: string]: any };
  sidebarStyleFinal: { [k: string]: any } = {};
  contentStyleFinal: { [k: string]: any } = {};
  overlayStyleFinal: { [k: string]: any } = {};
  sidebarWidth: number = 0;
  sidebarHeight: number = 0;
  sidebarTop: number = 0;
  dragHandleTop: number = 0;
  touchIdentifier: number = null;
  touchStartX: number = null;
  touchStartY: number = null;
  touchCurrentX: number = null;
  touchCurrentY: number = null;
  touchSupported: boolean = typeof window === 'object' && 'ontouchstart' in window;

  private _afterOpen = new Subject<void>();
  private _afterClose = new Subject<any>();
  private _docked: boolean = false;
  private _open: boolean = false;
  private _position: string = 'left';
  get afterOpen(): Observable<void> {
    return this._afterOpen.asObservable();
  }

  get afterClose(): Observable<any> {
    return this._afterClose.asObservable();
  }

  @Output() readonly onViewInit = new EventEmitter<void>();
  @Input() content: TemplateRef<any> | Type<any>;
  @ViewChild('drawerContent', { static: false }) drawerContent: ElementRef;
  @Input()
  sidebar: any;
  @Input()
  sidebarStyle: { [k: string]: any } = {};
  @Input()
  contentStyle: { [k: string]: any } = {};
  @Input()
  overlayStyle: { [k: string]: any } = {};
  @Input()
  dragHandleStyle: { [k: string]: any } = {};
  @Input()
  transitions: boolean = true;
  @Input()
  touch: boolean = true;
  @Input()
  enableDragHandle: boolean = false;
  @Input()
  dragToggleDistance: number = 30;
  @Input()
  get docked() {
    return this._docked;
  }
  set docked(v) {
    this._docked = v;
    this.dockedCls = v;
  }
  @Input()
  get open() {
    return this._open;
  }
  set open(v) {
    this._open = v;
    if (this._open) {
      setTimeout(() => {
        this.openCls = v;
        this.update();
        this._afterOpen.next();
      }, 50);
    } else {
      this.openCls = v;
      this.update();
      setTimeout(() => {
        this._afterClose.next();
        this._afterClose.complete();
      }, 300);
    }
  }
  @Input()
  set position(v) {
    this._position = v;
    this.right = false;
    this.left = false;
    this.top = false;
    this.bottom = false;
    switch (v) {
      case 'right':
        this.right = true;
        break;
      case 'left':
        this.left = true;
        break;
      case 'top':
        this.top = true;
        break;
      case 'bottom':
        this.bottom = true;
        break;
    }
  }
  @Output()
  onOpenChange: EventEmitter<any> = new EventEmitter<any>();

  @HostBinding('class.am-drawer')
  am: boolean = true;
  @HostBinding('class.am-drawer-left')
  left: boolean = this._position === 'left';
  @HostBinding('class.am-drawer-right')
  right: boolean = this._position === 'right';
  @HostBinding('class.am-drawer-top')
  top: boolean = this._position == 'top';
  @HostBinding('class.am-drawer-bottom')
  bottom: boolean = this._position == 'bottom';
  @HostBinding('class.am-drawer-docked')
  dockedCls: boolean = this._docked;
  @HostBinding('class.am-drawer-open')
  openCls: boolean = this._open;
  @HostBinding('class.am-drawer-loaded')
  loaded: boolean = false;

  close() {
    this._open = false;
    this.openCls = false;
    this.update();
    this._afterClose.next();
    this._afterClose.complete();
  }
  constructor(private _el: ElementRef, private renderer: Renderer2, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {}

  isTemplateRef(value: {}): boolean {
    return value instanceof TemplateRef;
  }

  onOverlayClicked = () => {
    this.open = !this.open;
    this.onOpenChange.emit(this.open);
  };

  isTouching() {
    return this.touchIdentifier !== null;
  }

  onTouchStart(event) {
    const touch = event.changedTouches[0];
    this.touchIdentifier = touch.identifier;
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchCurrentX = touch.clientX;
    this.touchCurrentY = touch.clientY;
  }

  onTouchMove(ev) {
    for (let ind = 0; ind < ev.changedTouches.length; ind++) {
      if (ev.changedTouches[ind].identifier === this.touchIdentifier) {
        this.touchCurrentX = ev.changedTouches[ind].clientX;
        this.touchCurrentY = ev.changedTouches[ind].clientY;
        break;
      }
    }
    this.update();
  }

  onTouchEnd() {
    const touchWidth = this.touchSidebarWidth();
    if (!this._open && touchWidth > this.dragToggleDistance) {
      this.onOpenChange.emit(!this._open);
    }

    const touchHeight = this.touchSidebarHeight();
    if (!this._open && touchHeight > this.dragToggleDistance) {
      this.onOpenChange.emit(!this._open);
    }
    this.touchIdentifier = null;
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchCurrentX = null;
    this.touchCurrentY = null;
    this.update();
  }

  saveSidebarSize() {
    const sidebar = this._el.nativeElement.querySelector('#sidebar');
    const dragHandle = this._el.nativeElement.querySelector('#dragHandle');

    const width = sidebar.offsetWidth;
    const height = sidebar.offsetHeight;
    const sidebarTop = this.getOffset(sidebar).top;
    const dragHandleTop = this.getOffset(dragHandle).top;

    if (width !== this.sidebarWidth) {
      this.sidebarWidth = width;
    }
    if (height !== this.sidebarHeight) {
      this.sidebarHeight = height;
    }
    if (sidebarTop !== this.sidebarTop) {
      this.sidebarTop = sidebarTop;
    }
    if (dragHandleTop !== this.dragHandleTop) {
      this.dragHandleTop = dragHandleTop;
    }
  }

  touchSidebarWidth() {
    if (this._position === 'right') {
      return Math.min(window.innerWidth - this.touchCurrentX, this.sidebarWidth);
    }

    if (this._position === 'left') {
      return Math.min(this.touchCurrentX, this.sidebarWidth);
    }
  }

  touchSidebarHeight() {
    if (this._position === 'bottom') {
      return Math.min(
        this._el.nativeElement.offsetHeight - this.touchCurrentY + this._el.nativeElement.offsetTop,
        this.sidebarHeight
      );
    }

    if (this._position === 'top') {
      return Math.min(this.touchCurrentY - this.dragHandleTop, this.sidebarHeight);
    }
  }

  renderStyle({ sidebarStyle, isTouching, overlayStyle, contentStyle }) {
    if (this._position === 'right' || this._position === 'left') {
      sidebarStyle.transform = `translateX(0%)`;
      sidebarStyle.WebkitTransform = `translateX(0%)`;
      if (isTouching) {
        const percentage = this.touchSidebarWidth() / this.sidebarWidth;
        // slide open to what we dragged
        if (this._position === 'right') {
          sidebarStyle.transform = `translateX(${(1 - percentage) * 100}%)`;
          sidebarStyle.WebkitTransform = `translateX(${(1 - percentage) * 100}%)`;
        }
        if (this._position === 'left') {
          sidebarStyle.transform = `translateX(-${(1 - percentage) * 100}%)`;
          sidebarStyle.WebkitTransform = `translateX(-${(1 - percentage) * 100}%)`;
        }
        overlayStyle.opacity = percentage;
        overlayStyle.visibility = 'visible';
      }
      if (contentStyle) {
        contentStyle[this._position] = `${this.sidebarWidth}px`;
      }
    }
    if (this._position === 'top' || this._position === 'bottom') {
      sidebarStyle.transform = `translateY(0%)`;
      sidebarStyle.WebkitTransform = `translateY(0%)`;
      if (isTouching) {
        const percentage = this.touchSidebarHeight() / this.sidebarHeight;
        if (this._position === 'bottom') {
          sidebarStyle.transform = `translateY(${(1 - percentage) * 100}%)`;
          sidebarStyle.WebkitTransform = `translateY(${(1 - percentage) * 100}%)`;
        }
        if (this._position === 'top') {
          sidebarStyle.transform = `translateY(-${(1 - percentage) * 100}%)`;
          sidebarStyle.WebkitTransform = `translateY(-${(1 - percentage) * 100}%)`;
        }
        overlayStyle.opacity = percentage;
        overlayStyle.visibility = 'visible';
      }
      if (contentStyle) {
        contentStyle[this._position] = `${this.sidebarHeight}px`;
      }
    }
  }

  update() {
    const sidebarStyle = { ...this.sidebarStyle };
    const contentStyle = { ...this.contentStyle };
    const overlayStyle = { ...this.overlayStyle };

    if (this.isTouching()) {
      this.renderStyle({
        sidebarStyle: sidebarStyle,
        isTouching: true,
        contentStyle: undefined,
        overlayStyle: overlayStyle
      });
    } else if (this._docked) {
      this.dockedCls = true;
      this.renderStyle({
        sidebarStyle: sidebarStyle,
        isTouching: undefined,
        contentStyle: contentStyle,
        overlayStyle: undefined
      });
    } else if (this._open) {
      this.openCls = true;
      this.renderStyle({
        sidebarStyle: sidebarStyle,
        isTouching: undefined,
        contentStyle: undefined,
        overlayStyle: undefined
      });
      overlayStyle.opacity = 1;
      overlayStyle.visibility = 'visible';
    }

    if (this.isTouching() || !this.transitions) {
      sidebarStyle.transition = 'none';
      sidebarStyle.WebkitTransition = 'none';
      contentStyle.transition = 'none';
      overlayStyle.transition = 'none';
    }
    this.sidebarStyleFinal = sidebarStyle;
    this.contentStyleFinal = contentStyle;
    this.overlayStyleFinal = overlayStyle;
  }

  getOffset(ele) {
    let el = ele;
    let _x = 0;
    let _y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      _x += el.offsetLeft - el.scrollLeft;
      _y += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
    }
    return { top: _y, left: _x };
  }

  resizeStyle() {
    if (this.styleFinal) {
      this.renderer.setProperty(this._el.nativeElement, 'style', this.styleFinal);
    } else if (this._el.nativeElement.clientHeight <= 0 && this._el.nativeElement.clientWidth <= 0) {
      this.renderer.setStyle(this._el.nativeElement, 'height', `${document.body.clientHeight}px`);
      this.renderer.setStyle(this._el.nativeElement, 'width', `${document.body.clientWidth}px`);
    }
  }

  ngAfterViewChecked() {
    if (!this.isTouching()) {
      this.saveSidebarSize();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.update();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loaded = true;
      this.resizeStyle();
      this.onViewInit.emit();
    });
  }
  ngOnDestroy(): void {}
}

@Component({
  selector: 'DrawerService',
  templateUrl: './drawer.component.html',
  encapsulation: ViewEncapsulation.None
})
export class DrawerServiceComponent extends DrawerComponent {
  constructor(private __el: ElementRef, private __renderer: Renderer2, private __changeDetectorRef: ChangeDetectorRef) {
    super(__el, __renderer, __changeDetectorRef);
  }
}
