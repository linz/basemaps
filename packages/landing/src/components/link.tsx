import { Component, RenderableProps, ComponentChild } from 'preact';

interface IconProps {
  name: string;
}
export class Icon extends Component<IconProps> {
  render(props: RenderableProps<IconProps>): ComponentChild {
    return <i class="material-icons-round md-36">{props.name}</i>;
  }
}

interface LinkProps {
  href: string;
  icon?: boolean | ComponentChild;
  ariaLabel?: string;
}
export class Link extends Component<LinkProps> {
  render(props: RenderableProps<LinkProps>): ComponentChild {
    let icon: ComponentChild | null = null;
    if (props.icon == null || typeof props.icon === 'boolean') icon = <Icon name="launch" />;
    if (typeof props.icon === 'string') icon = <Icon name={props.icon} />;
    else icon = props.icon;

    return (
      <a rel="noopener" target="_blank" href={props.href} style="display:flex;" aria-label={props.ariaLabel}>
        {props.children}
        {icon}
      </a>
    );
  }
}
