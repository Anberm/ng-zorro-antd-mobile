import {
    Injectable,
    ViewEncapsulation,
    Component,
    TemplateRef,
    ComponentRef,
    Injector,
  } from '@angular/core';
  import { isBoolean } from 'util';
  import { OverlayRef, Overlay } from '@angular/cdk/overlay';
  import { Subject } from 'rxjs';
  import { takeUntil } from 'rxjs/operators';
  import { ComponentPortal } from '@angular/cdk/portal';
import { ModalServiceComponent } from './modal.component';
import { ModalBaseOptions, ModalOptions } from './modal-options.provider';
  
export class ModalBuilderForService<R> {
  private modalRef: ComponentRef<ModalServiceComponent>;
  private overlayRef: OverlayRef;
  private unsubscribe$ = new Subject<void>();

  constructor(private overlay: Overlay, private options: ModalBaseOptions) {
    // this.updateOptions(this.options);
    this.init();
  }

  init() {
    this.createModal();
    this.modalRef.instance.afterClose
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.overlayRef.dispose();
        this.modalRef = null;
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
      });
  }

  getInstance(): ModalServiceComponent {
    return this.modalRef && this.modalRef.instance;
  }

  createModal() {
    // return new Promise(resolve => {
    this.overlayRef = this.overlay.create();
    const childInjector = Injector.create([
      {
        provide: ModalOptions,
        useValue: this.options,
      },
    ]);

    // setTimeout(() => {
    this.modalRef = this.overlayRef.attach(
      new ComponentPortal(ModalServiceComponent, undefined, childInjector),
    );
    // this.modalRef.instance.writeValue(true);
    //     resolve();
    //   });
    // });
  }

  updateOptions(options: ModalOptions): void {
    Object.assign(this.modalRef.instance, options);
  }
}

@Injectable({
  providedIn: 'root',
})
@Injectable()
export class ZmFullModalService {
  instances: ModalServiceComponent[] = [];

  constructor(private overlay: Overlay) {}

  private _initConfig(
    config: ModalBaseOptions,
    options: any,
  ): ModalBaseOptions {
    const props: ModalBaseOptions = new ModalBaseOptions();
    const optionalParams: string[] = [
      'visible',
      'focus',
      'prefixCls',
      'animated',
      'closable',
      'maskClosable',
      'onClose',
      'transparent',
      'popup',
      'animationType',
      'title',
      'footer',
      'platform',
      'className',
      'wrapClassName',
      'message',
      'content',
      'actions',
      'callbackOrActions',
      'type',
      'defaultValue',
      'placeholders',
      'operation',
      'transitionName',
      'maskTransitionName',
      'close',
      'closeWithAnimation'

    ];
    const self = this;
    config = Object.assign(
      options,
      config,
      {
        close: (e): void => {
          if (config.maskClosable || config.closable) {
            e.close();
          }
        }
      }
    );
    optionalParams.forEach(key => {
      if (config[key] !== undefined) {
        props[key] = config[key];
      }
    });
    return props;
  }

  getFooter(actions) {
      const action = actions ? actions : [];
      return action.map((button: any) => {
        const orginPress = button.onPress || function(e) {};
        button.onPress = (e) => {
          const res = orginPress();
          if (res && res.then) {
            res.then(() => {
              e.closeWithService()
            });
          } else {
              e.closeWithService();
          }
        };
        return button;
      });
    }
  
  // tslint:disable-next-line:no-any
  create<T = any, D = any, R = any>(
    options: ModalOptions,
  ): ModalServiceComponent {
    const instance = new ModalBuilderForService<R>(
      this.overlay,
      options,
    ).getInstance();
    this.instances = this.instances.filter(x => x !== null || x !== undefined);
    this.instances.push(instance);
    return instance;
  }

  closeAll() {
    this.instances = this.instances.filter(x => x !== null || x !== undefined);
    this.instances.forEach(x => {
      x.writeValue(false);
    });
    this.instances = [];
  }
  openModal(
    title?: string | TemplateRef<any>,
    content?: string | TemplateRef<any>,
    actions?: Array<any>,
    platform?: string,
    className?: string,
    closable?: boolean,
    animationType?: string,
    popup?: boolean,
  ) {
    const options: ModalOptions = new ModalOptions();
    options.visible = true;
    options.transparent = true;
    options.closable = isBoolean(closable) ? closable : true;
    options.maskClosable = true;
    options.popup = isBoolean(popup) ? popup : true;
    options.animationType = animationType ? animationType : 'slide-up';
    options.platform = 'ios';
    const footer = this.getFooter(actions);
    const config = Object.assign({
      title: title,
      content: content,
      footer: footer,
      actions: footer,
      platform: platform ? platform : 'ios',
      className: className ? className : 'lm__modal',
    });
    const props = this._initConfig(config, options);
    return this.create(props);
  }
}
