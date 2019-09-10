import {
  Input,
  Output,
  Component,
  forwardRef,
  ElementRef,
  TemplateRef,
  EventEmitter,
  HostListener,
  ViewEncapsulation,
  Type
} from '@angular/core';
import { ModalOptions } from './modal-options.provider';
import { Observable, Subject } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ModalRef } from './modal-ref.class';
export const MODAL_ANIMATE_DURATION = 200; // Duration when perform animations (ms)
type AnimationState = 'enter' | 'leave' | null;
@Component({
  selector: 'Modal',
  templateUrl: './modal.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    ModalOptions,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ModalComponent),
      multi: true
    }
  ]
})
export class ModalComponent<T = any, R = any> extends ModalRef<T, R> implements ControlValueAccessor {
  autoFocus = { focus: true, date: new Date() };
  transitionName: string = '';
  maskTransitionName: string = '';
  wrapCls: object = {};
  cls: object = {};
  btnGroupClass: object = {};
  data = {
    text: '',
    password: ''
  };

  private animationState: AnimationState;
  private _afterOpen = new Subject<void>();
  private _afterClose = new Subject<any>();
  get afterOpen(): Observable<void> {
    return this._afterOpen.asObservable();
  }

  get afterClose(): Observable<any> {
    return this._afterClose.asObservable();
  }

  onChanged: (visiable: boolean) => {};
  onTouched: () => {};

  @Input()
  set title(value: string | TemplateRef<any>) {
    this.option.title = value;
  }

  @Input()
  set closable(value: boolean) {
    this.option.closable = value;
  }
  @Input()
  set maskClosable(value: boolean) {
    this.option.maskClosable = value;
  }
  @Input()
  set popup(value: boolean) {
    this.option.popup = value;
    this.setClassMap();
  }
  @Input()
  set animationType(value: string) {
    this.option.animationType = value;
    this.setClassMap();
  }
  @Input()
  set transparent(value: boolean) {
    this.option.transparent = value;
    this.setClassMap();
  }
  @Input()
  set footer(value: Array<any>) {
    this.option.footer = value;
  }
  @Input()
  set platform(value: string) {
    this.option.platform = value;
    this.setClassMap();
  }
  @Input()
  set className(value: string) {
    this.option.className = value;
    this.setClassMap();
  }
  @Input()
  set wrapClassName(value: string) {
    this.option.wrapClassName = value;
    this.setClassMap();
  }
  @Input()
  set actions(value: Array<any>) {
    this.option.footer = value;
    this.setClassMap();
  }
  @Input()
  set defaultValue(value: Array<string>) {
    this.option.defaultValue = value !== undefined ? value : ['', ''];
  }
  @Input()
  set type(value: string) {
    this.option.type = value;
  }
  @Input()
  set placeholders(value: Array<string>) {
    this.option.placeholders = value;
  }
  @Input()
  set operation(value: boolean) {
    this.option.operation = value;
    this.setClassMap();
  }
  @Output()
  onClose: EventEmitter<any> = new EventEmitter();

  @HostListener('mouseup', ['$event'])
  @HostListener('touchend', ['$event'])
  panend(event) {
    if (this.option.closable || this.option.maskClosable || this.option.popup) {
      if (
        (event && event.target && event.target.getAttribute('role') === 'dialog') ||
        event.target.getAttribute('role') === 'close'
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
    }
  }
  get hidden(): boolean {
    return !this.option.visible && !this.animationState;
  }

  constructor(public option: ModalOptions, public elementRef: ElementRef) {
    super();
  }

  isNonEmptyString(value: {}): boolean {
    return typeof value === 'string' && value !== '';
  }

  isTemplateRef(value: string | TemplateRef<any>) {
    return value instanceof TemplateRef;
  }

  isComponent(value: {}): boolean {
    return value instanceof Type;
  }

  isNoTitle(value: string | TemplateRef<any>) {
    return value === '' || value === null || value === undefined;
  }

  setTransitionName(visible: boolean) {
    if (!visible) {
      this.leaveAnimation();
    } else {
      if (this.option.animated) {
        this.animationState = 'enter';
        if (this.option.transparent) {
          if (this.setActiveName(this.option.transitionName)) {
            this.transitionName = this.setActiveName(this.option.transitionName);
            this.maskTransitionName = this.setActiveName(this.option.maskTransitionName);
          } else {
            this.transitionName = this.maskTransitionName = this.setActiveName('am-fade');
          }
        } else {
          if (this.setActiveName(this.option.transitionName)) {
            this.transitionName = this.setActiveName(this.option.transitionName);
            this.maskTransitionName = this.setActiveName(this.option.maskTransitionName);
          } else {
            this.transitionName = this.maskTransitionName = this.setActiveName('am-slide-up');
          }
        }
        if (this.option.popup) {
          this.transitionName =
            this.option.animationType === 'slide-up'
              ? this.setActiveName('am-slide-up')
              : this.setActiveName('am-slide-down');
          this.maskTransitionName = this.setActiveName('am-fade');
        }
        setTimeout(() => {
          this.animationState = null;
          this._afterOpen.next();
        }, MODAL_ANIMATE_DURATION);
      }
      this.setClassMap();
    }
  }

  setActiveName(name: string) {
    return name.length > 0 ? `${name}-enter ${name}-enter-active` : null;
  }

  setLeaveActiveName(name: string) {
    return name.length > 0 ? `${name}-leave ${name}-leave-active` : null;
  }

  setClassMap() {
    this.wrapCls = {
      [this.option.wrapClassName]: true,
      [`${this.option.prefixCls}-wrap-popup`]: this.option.popup
    };

    this.cls = {
      [this.option.className]: true,
      [`${this.option.prefixCls}-transparent`]: this.option.transparent,
      [`${this.option.prefixCls}-popup`]: this.option.popup,
      [`${this.option.prefixCls}-popup-${this.option.animationType}`]: this.option.popup && this.option.animationType,
      [`${this.option.prefixCls}-android`]: this.option.platform === 'android'
    };

    this.btnGroupClass = {
      [`${this.option.prefixCls}-button-group-${
        this.option.footer.length === 2 && !this.option.operation ? 'h' : 'v'
      }`]: true,
      [`${this.option.prefixCls}-button-group-${this.option.operation ? 'operation' : 'normal'}`]: true
    };
  }

  inputChange(type: string, value: string) {
    this.data[type] = value;
  }

  leaveAnimation() {
    if (this.option.animated) {
      this.animationState = 'leave';
      if (this.option.transparent) {
        if (this.setLeaveActiveName(this.option.transitionName)) {
          this.transitionName = this.setLeaveActiveName(this.option.transitionName);
          this.maskTransitionName = this.setLeaveActiveName(this.option.maskTransitionName);
        } else {
          this.transitionName = this.maskTransitionName = this.setLeaveActiveName('am-fade');
        }
      } else {
        if (this.setLeaveActiveName(this.option.transitionName)) {
          this.transitionName = this.setLeaveActiveName(this.option.transitionName);
          this.maskTransitionName = this.setLeaveActiveName(this.option.maskTransitionName);
        } else {
          this.transitionName = this.maskTransitionName = this.setLeaveActiveName('am-slide-up');
        }
      }
      if (this.option.popup) {
        this.transitionName =
          this.option.animationType === 'slide-up'
            ? this.setLeaveActiveName('am-slide-up')
            : this.setLeaveActiveName('am-slide-down');
        this.maskTransitionName = this.setLeaveActiveName('am-fade');
      }
      setTimeout(() => {
        this.animationState = null;
        this._afterClose.next();
        this._afterClose.complete();
      }, MODAL_ANIMATE_DURATION);
    } else {
      this._afterClose.next();
    }
    this.option.visible = false;
    if (this.onChanged) {
      this.onChanged(this.option.visible);
    }
  }

  closeWithService() {
    this.transitionName = `${this.option.transitionName}-leave ${this.option.transitionName}-leave-active`;
    this.maskTransitionName = `${this.option.maskTransitionName}-leave ${this.option.maskTransitionName}-leave-active`;
    setTimeout(() => {
      this._afterClose.next();
      this._afterClose.complete();
    }, MODAL_ANIMATE_DURATION);
  }

  writeValue(value: boolean): void {
    if (value) {
      this.option.visible = value;
    }
    this.setTransitionName(value);
  }

  registerOnChange(fn: (_: boolean) => {}): void {
    this.onChanged = fn;
  }

  registerOnTouched(fn: () => {}): void {
    this.onTouched = fn;
  }

  close() {
    if (this.option.closeWithAnimation) {
      this.option.closeWithAnimation(this);
    } else if (this.option.close) {
      this.option.close(this);
    } else {
      this.onClose.emit();
      this.leaveAnimation();
    }

    this._afterOpen.complete();
  }

  getInstance(): ModalComponent {
    return this;
  }

  getElement(): HTMLElement {
    return this.elementRef && this.elementRef.nativeElement;
  }

  triggerOk(): void {
    if (this.option.footer.length > 1) {
      const button = this.option.footer[1];
      button.onPress(this);
    }
  }

  triggerCancel(): void {
    if (this.option.footer.length > 0) {
      const button = this.option.footer[0];
      button.onPress(this);
    }
  }

  destroy(): void {
    this.close();
  }
}

@Component({
  selector: 'ModalService',
  templateUrl: './modal.component.html',
  encapsulation: ViewEncapsulation.None
})
export class ModalServiceComponent extends ModalComponent {
  constructor(public option: ModalOptions, public elementRef: ElementRef) {
    super(option, elementRef);
    this.setTransitionName(this.option.visible);
  }
}
