import Image from 'next/image'
import styles from './page.module.css'
import {Button} from '@nextui-org/button'; 

export default function Page2() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Get started by editing&nbsp;
          <code className={styles.code}>app/page.js</code>
        </p>
        <div>
        <Button>Click me</Button>
        </div>
      </div>
    </main>
  )
}
